import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import {
  MatchPayment,
  MatchPaymentDocument,
} from './schemas/match-payment.schema';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import { Match, MatchDocument } from '../matches/schemas/match.schema';
import { PaymentCalculationService } from './services/payment-calculation.service';
import {
  GeneratePaymentDto,
  FilterPaymentsDto,
  ValidatePaymentDto,
  RejectPaymentDto,
  MarkPaidDto,
  BulkValidateDto,
  PaymentStatisticsDto,
  PreviewMatchesDto,
  PreviewTotalDto,
} from './dto/payment.dto';
import { PaymentStatus, Role, MatchStatus, RefereeCategory } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/schemas/user.schema';
import { getAllowedCategoriesForRole } from '../common/helpers';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(MatchPayment.name)
    private matchPaymentModel: Model<MatchPaymentDocument>,
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel('User') private userModel: Model<User>,
    private paymentCalculationService: PaymentCalculationService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) { }

  /**
   * Auto-calculate MatchPayment records for a list of matches × a specific referee.
   * Idempotent — skips if a MatchPayment already exists for (matchId, refereeId).
   * Only creates a record when a matching PaymentRate exists.
   * Returns warnings for matches where NO rate was found (record NOT created — no phantom zeros).
   */
  private async ensureMatchPayments(
    matchIds: Types.ObjectId[],
    refereeId: string,
  ): Promise<string[]> {
    const warnings: string[] = [];
    const matches = await this.matchModel
      .find({ _id: { $in: matchIds } })
      .exec();

    for (const match of matches) {
      const designations: any[] = (match as any).designations ?? [];
      const designation = designations.find(
        (d: any) => d.refereeId?.toString() === refereeId,
      );
      if (!designation) continue;

      // Idempotent: skip if already calculated
      const existing = await this.matchPaymentModel.findOne({
        matchId: match._id,
        refereeId: new Types.ObjectId(refereeId),
      });
      if (existing) continue;

      // Calculate amount from rate table
      const { amount: baseAmount, rateFound } =
        await this.paymentCalculationService.calculateMatchPayment(
          (match._id as Types.ObjectId).toString(),
          refereeId,
          designation.role,
        );

      if (!rateFound) {
        // Do NOT create a 0-amount record — that would block recalculation
        // once the admin configures the missing rate.
        warnings.push(
          `Match ${(match as any).matchNumber || match._id} — ` +
          `aucun barème configuré pour rôle "${designation.role}" ` +
          `(catégorie arbitre + compétition + saison).`,
        );
        continue; // skip creating the record
      }

      await this.matchPaymentModel.create({
        matchId: match._id,
        refereeId: new Types.ObjectId(refereeId),
        role: designation.role,
        baseAmount,
        totalAmount: baseAmount,
      });
    }
    return warnings;
  }

  async generatePayment(
    generatePaymentDto: GeneratePaymentDto,
    userRole?: string,
  ): Promise<Payment> {
    const { refereeId, startDate, endDate, label } = generatePaymentDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid ISO dates');
    }
    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const referee = await this.refereeModel.findById(refereeId);
    if (!referee) {
      throw new NotFoundException(`L'arbitre avec l'ID ${refereeId} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à générer un paiement pour cet arbitre");
    }

    // Resolve the match list first (before the duplicate check)
    let resolvedMatchIds: Types.ObjectId[];

    if (generatePaymentDto.matchIds && generatePaymentDto.matchIds.length > 0) {
      resolvedMatchIds = generatePaymentDto.matchIds.map((id) => new Types.ObjectId(id));
    } else {
      const matches = await this.matchModel
        .find({
          date: { $gte: start, $lt: end },
          status: MatchStatus.COMPLETED,
          'designations.refereeId': new Types.ObjectId(refereeId),
        })
        .select('_id')
        .exec();
      resolvedMatchIds = matches.map((m) => m._id as Types.ObjectId);
    }

    if (resolvedMatchIds.length === 0) {
      throw new BadRequestException(
        `Aucun match complété trouvé pour cet arbitre sur la période ${startDate} → ${endDate}`,
      );
    }

    // GUARD: find any non-rejected invoice for this referee
    //        that already contains at least one of the requested matchIds.
    //
    // NOTE: A match CAN appear in invoices for different referees
    //       (e.g. ARBITRE_CENTRAL and ARBITRE_ASSISTANT on the same match).
    //       We only prevent double-payment for the SAME referee × same match.
    const conflictingInvoices = await this.paymentModel
      .find({
        refereeId: new Types.ObjectId(refereeId),
        status: { $nin: [PaymentStatus.REJECTED] },
        matchIds: { $elemMatch: { $in: resolvedMatchIds } },
      })
      .select('_id label startDate endDate matchIds')
      .exec();

    if (conflictingInvoices.length > 0) {
      // Build a helpful error: list which matches are already invoiced
      const alreadyUsedMatchIds = new Set<string>();
      for (const inv of conflictingInvoices) {
        for (const mid of inv.matchIds) {
          const midStr = mid.toString();
          if (resolvedMatchIds.some((r) => r.toString() === midStr)) {
            alreadyUsedMatchIds.add(midStr);
          }
        }
      }
      throw new BadRequestException(
        `Impossible de créer la facture : ${alreadyUsedMatchIds.size} match(s) sont déjà inclus dans une facture existante pour cet arbitre. ` +
        `Veuillez consulter l'aperçu des matchs disponibles et exclure les matchs déjà facturés.`,
      );
    }

    // AUTO-CALCULATE: ensure MatchPayment records exist (idempotent)
    // Only creates records where a matching PaymentRate exists.
    const calcWarnings = await this.ensureMatchPayments(resolvedMatchIds, refereeId);

    // BLOCK if any match is missing a configured rate — force admin to fix rates first
    if (calcWarnings.length > 0) {
      throw new BadRequestException(
        `Impossible de générer la facture : ${calcWarnings.length} match(s) n'ont pas de barème de paiement configuré. ` +
        `Veuillez contacter l'administrateur pour configurer les barèmes manquants, ou exclure ces matchs de la facture.\n\n` +
        calcWarnings.join('\n'),
      );
    }

    // Aggregate MatchPayments for the resolved matches
    const matchPayments = await this.matchPaymentModel
      .find({
        refereeId: new Types.ObjectId(refereeId),
        matchId: { $in: resolvedMatchIds },
      })
      .exec();

    const baseAmount = matchPayments.reduce((sum, mp) => sum + (mp.baseAmount || 0), 0);
    const bonuses = matchPayments.reduce((sum, mp) => sum + (mp.bonus || 0), 0);
    const deductions = matchPayments.reduce((sum, mp) => sum + (mp.deduction || 0), 0);

    const payment = await this.paymentModel.create({
      refereeId: new Types.ObjectId(refereeId),
      startDate: start,
      endDate: end,
      label: label ?? undefined,
      matchIds: resolvedMatchIds,
      totalMatches: resolvedMatchIds.length,
      baseAmount,
      bonuses,
      deductions,
      totalAmount: baseAmount + bonuses - deductions,
      status: PaymentStatus.PENDING,
      region: referee.region,
      category: referee.category,
      warnings: calcWarnings.length > 0 ? calcWarnings : undefined,
    });

    return payment;
  }

  /**
   * Step 3 — Preview matches the referee worked on in a date range.
   * Returns full match data + per-match payment amounts if already calculated.
   * No DB writes.
   */
  async previewMatches(dto: PreviewMatchesDto, userRole?: string): Promise<any[]> {
    const { refereeId, startDate, endDate } = dto;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid ISO dates');
    }

    const referee = await this.refereeModel.findById(refereeId);
    if (!referee) {
      throw new NotFoundException(`Arbitre ${refereeId} introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à voir les matchs de cet arbitre");
    }

    // Get all COMPLETED matches in range where referee was designated
    const matches = await this.matchModel
      .find({
        date: { $gte: start, $lt: end },
        status: MatchStatus.COMPLETED,
        'designations.refereeId': new Types.ObjectId(refereeId),
      })
      .populate('homeTeamId', 'name shortName')
      .populate('awayTeamId', 'name shortName')
      .sort({ date: 1 })
      .exec();

    const matchIds = matches.map((m) => m._id as Types.ObjectId);

    // AUTO-CALCULATE: ensure MatchPayment records exist (idempotent)
    await this.ensureMatchPayments(matchIds, refereeId);

    // Fetch the (now guaranteed to exist) MatchPayments for these matches
    const matchPayments = await this.matchPaymentModel
      .find({
        refereeId: new Types.ObjectId(refereeId),
        matchId: { $in: matchIds },
      })
      .exec();

    // Build map: matchId -> MatchPayment record
    const paymentMap = new Map(
      matchPayments.map((mp) => [mp.matchId.toString(), mp]),
    );

    // Find which matches are already in a non-rejected invoice for this referee
    // so the frontend can disable/grey those checkboxes
    const existingInvoices = await this.paymentModel
      .find({
        refereeId: new Types.ObjectId(refereeId),
        status: { $nin: [PaymentStatus.REJECTED] },
        matchIds: { $elemMatch: { $in: matchIds } },
      })
      .select('_id label startDate endDate matchIds status')
      .exec();

    // Build a map: matchId string -> invoice info
    const invoicedMatchMap = new Map<string, { invoiceId: string; label?: string; status: string }>();
    for (const inv of existingInvoices) {
      for (const mid of inv.matchIds) {
        invoicedMatchMap.set(mid.toString(), {
          invoiceId: (inv._id as Types.ObjectId).toString(),
          label: inv.label,
          status: inv.status,
        });
      }
    }

    return matches.map((match) => {
      const matchIdStr = (match._id as Types.ObjectId).toString();
      const mp = paymentMap.get(matchIdStr);
      const invoiceInfo = invoicedMatchMap.get(matchIdStr);
      const designation = (match as any).designations?.find(
        (d: any) => d.refereeId?.toString() === refereeId,
      );
      return {
        matchId: match._id,
        matchNumber: (match as any).matchNumber,
        date: (match as any).date,
        homeTeam: (match as any).homeTeam,
        awayTeam: (match as any).awayTeam,
        competition: (match as any).competition,
        stadium: (match as any).stadium,
        role: designation?.role ?? null,
        paymentCalculated: !!mp,
        baseAmount: mp?.baseAmount ?? null,
        bonus: mp?.bonus ?? 0,
        deduction: mp?.deduction ?? 0,
        totalAmount: mp?.totalAmount ?? null,
        // Frontend: if alreadyInvoiced is true, disable this checkbox
        alreadyInvoiced: !!invoiceInfo,
        invoiceInfo: invoiceInfo ?? null,
      };
    });
  }

  /**
   * Step 5 — Preview total payment for a curated set of match IDs.
   * Returns breakdown without creating any document.
   */
  async previewTotal(dto: PreviewTotalDto, userRole?: string): Promise<{
    refereeId: string;
    selectedMatches: number;
    baseAmount: number;
    bonuses: number;
    deductions: number;
    totalAmount: number;
    breakdown: any[];
    warnings: string[];
  }> {
    const { refereeId, matchIds } = dto;
    const resolvedIds = matchIds.map((id) => new Types.ObjectId(id));

    const referee = await this.refereeModel.findById(refereeId);
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (referee && allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à voir les paiements de cet arbitre");
    }

    const matchPayments = await this.matchPaymentModel
      .find({
        refereeId: new Types.ObjectId(refereeId),
        matchId: { $in: resolvedIds },
      })
      .populate('matchId', 'matchNumber date homeTeam awayTeam competition')
      .exec();

    const warnings: string[] = [];
    const foundMatchIds = new Set(matchPayments.map((mp) => mp.matchId.toString()));
    for (const id of matchIds) {
      if (!foundMatchIds.has(id)) {
        warnings.push(`No MatchPayment record found for match ${id} — run match-payments/calculate first`);
      }
    }

    const baseAmount = matchPayments.reduce((sum, mp) => sum + mp.baseAmount, 0);
    const bonuses = matchPayments.reduce((sum, mp) => sum + (mp.bonus || 0), 0);
    const deductions = matchPayments.reduce((sum, mp) => sum + (mp.deduction || 0), 0);

    const breakdown = matchPayments.map((mp) => ({
      matchId: mp.matchId,
      baseAmount: mp.baseAmount,
      bonus: mp.bonus,
      deduction: mp.deduction,
      totalAmount: mp.totalAmount,
      role: mp.role,
    }));

    return {
      refereeId,
      selectedMatches: matchIds.length,
      baseAmount,
      bonuses,
      deductions,
      totalAmount: baseAmount + bonuses - deductions,
      breakdown,
      warnings,
    };
  }

  async findAll(filterDto: FilterPaymentsDto, userRole?: string): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      month,   // kept in FilterPaymentsDto for partial backwards compat — unused here
      saison,  // same
      region,
      refereeId,
    } = filterDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (region) filter.region = region;
    if (refereeId) filter.refereeId = new Types.ObjectId(refereeId);

    // Category may be a single value or a list (e.g. C1,C2). Intersect any
    // requested categories with the role's allowed scope so RBAC is preserved.
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    const requestedCategories = category
      ? Array.isArray(category)
        ? category
        : [category]
      : null;
    if (requestedCategories && requestedCategories.length > 0) {
      filter.category = {
        $in: allowedCategories
          ? requestedCategories.filter((c) => allowedCategories.includes(c))
          : requestedCategories,
      };
    } else if (allowedCategories) {
      filter.category = { $in: allowedCategories };
    }

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'refereeId',
          select: 'userId',               
          populate: { 
            path: 'userId',                
            select: 'firstName lastName'    
         }
      })
        .populate('validatedBy', 'lastName firstName email')
        .sort({ createdAt: -1 })
        .exec(),
      this.paymentModel.countDocuments(filter),
    ]);

    return { payments, total, page, limit };
  }

  async findOne(id: string, userRole?: string): Promise<Payment> {
    const payment = await this.paymentModel
      .findById(id)
      .populate('refereeId')
      .populate('validatedBy', '-password')
      .populate('matchIds')
      .exec();

    if (!payment) {
      throw new NotFoundException(`Le paiement avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(payment.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce paiement");
    }

    return payment;
  }

  async findByReferee(refereeId: string, userRole?: string): Promise<Payment[]> {
    const referee = await this.refereeModel.findById(refereeId);
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (referee && allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder aux paiements de cet arbitre");
    }

    return this.paymentModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .populate('validatedBy', 'nom prenom')
      .sort({ startDate: -1 })
      .exec();
  }

  async validate(
    id: string,
    userId: string,
    userRole: Role,
    dto: ValidatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new NotFoundException(`Le paiement avec l'ID ${id} est introuvable`);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Le paiement n\'est pas en attente de validation');
    }

    this.checkValidationPermission(payment.category, userRole);

    payment.status = PaymentStatus.VALIDATED;
    payment.validatedBy = new Types.ObjectId(userId);
    payment.validatedAt = new Date();
    if (dto.notes) {
      payment.notes = payment.notes
        ? `${payment.notes}\n${dto.notes}`
        : dto.notes;
    }

    const savedPayment = await payment.save();

    // Send notification to referee after validation — fire and forget
    this.sendPaymentValidationNotification(savedPayment).catch((err) => {
      console.error('Error sending payment validation notification:', err);
    });

    return savedPayment;
  }

  /** Send notification to referee when payment is validated */
  private async sendPaymentValidationNotification(
    payment: PaymentDocument,
  ): Promise<void> {
    const referee = await this.refereeModel
      .findById(payment.refereeId)
      .populate('userId');

    if (!referee || !referee.userId) return;

    const userIdField = referee.userId as any;
    const userId = userIdField._id?.toString() || userIdField.toString();
    const phone = userIdField.phoneNumber || null;
    const refereeName =
      `${userIdField.firstName || ''} ${userIdField.lastName || ''}`.trim() ||
      'Arbitre';

    // Build a human-readable period from label, or fall back to date range
    const period =
      payment.label ||
      `${(payment as any).startDate?.toLocaleDateString('fr-FR') ?? ''} → ${(payment as any).endDate?.toLocaleDateString('fr-FR') ?? ''}`;

    await this.notificationsService.notifyPaymentValidated(userId, phone, {
      refereeName,
      amount: payment.totalAmount || 0,
      period,
      matchCount: payment.totalMatches || 0,
      paymentId: payment._id.toString(),
    });
  }

  async reject(
    id: string,
    userId: string,
    userRole: Role,
    dto: RejectPaymentDto,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new NotFoundException(`Le paiement avec l'ID ${id} est introuvable`);
    }

    this.checkValidationPermission(payment.category, userRole);

    payment.status = PaymentStatus.REJECTED;
    payment.validatedBy = new Types.ObjectId(userId);
    payment.validatedAt = new Date();
    payment.notes = payment.notes
      ? `${payment.notes}\nRejected: ${dto.reason}`
      : `Rejected: ${dto.reason}`;

    return payment.save();
  }

  async markPaid(id: string, dto: MarkPaidDto): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new NotFoundException(`Le paiement avec l'ID ${id} est introuvable`);
    }

    if (payment.status !== PaymentStatus.VALIDATED) {
      throw new BadRequestException(
        'Seuls les paiements validés peuvent être marqués comme payés',
      );
    }

    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.paymentMethod = dto.paymentMethod;
    if (dto.referenceNumber) {
      payment.referenceNumber = dto.referenceNumber;
    }
    if (dto.notes) {
      payment.notes = payment.notes
        ? `${payment.notes}\n${dto.notes}`
        : dto.notes;
    }

    return payment.save();
  }

  async bulkValidate(
    userId: string,
    userRole: Role,
    dto: BulkValidateDto,
  ): Promise<{ validated: number; failed: string[] }> {
    const failed: string[] = [];
    let validated = 0;

    for (const paymentId of dto.paymentIds) {
      try {
        await this.validate(paymentId, userId, userRole, { notes: dto.notes });
        validated++;
      } catch {
        failed.push(paymentId);
      }
    }

    return { validated, failed };
  }

  async findPending(userRole?: string): Promise<Payment[]> {
    const filter: any = { status: PaymentStatus.PENDING };
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories) {
      filter.category = { $in: allowedCategories };
    }

    return this.paymentModel
      .find(filter)
      .populate('refereeId', 'nom prenom category')
      .sort({ createdAt: 1 })
      .exec();
  }

  async getStatistics(dto: PaymentStatisticsDto, userRole?: string): Promise<any> {
    const filter: any = {};

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;

    if (dto.category) {
      if (allowedCategories && !allowedCategories.includes(dto.category)) {
         filter.category = "NONE";
      } else {
         filter.category = dto.category;
      }
    } else if (allowedCategories) {
      filter.category = { $in: allowedCategories };
    }

    if (dto.startDate && dto.endDate) {
      filter.createdAt = {
        $gte: new Date(dto.startDate),
        $lte: new Date(dto.endDate),
      };
    }

    const [totalStats, byCategory, byRegion, byStatus] = await Promise.all([
      this.paymentModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalPayments: { $sum: 1 },
            avgAmount: { $avg: '$totalAmount' },
          },
        },
      ]),
      this.paymentModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.paymentModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$region',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.paymentModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      overview: totalStats[0] || {
        totalAmount: 0,
        totalPayments: 0,
        avgAmount: 0,
      },
      byCategory,
      byRegion,
      byStatus,
    };
  }

  /**
   * Single authoritative permission check.
   * ADMIN_DNA and FINANCE_DNA can validate any category.
   * Commission heads are restricted to their category scope.
   */
  checkValidationPermission(paymentCategory: RefereeCategory, userRole: Role): void {
    if (userRole === Role.ADMIN_DNA || userRole === Role.FINANCE_DNA) {
      return;
    }

    const categoryMap: Record<string, Role[]> = {
      C1: [Role.CAA],
      C2: [Role.CAA],
      JEUNE: [Role.CAJ],
      FEMININE: [Role.CAF],
      REGIONAL: [Role.CRA],
    };

    const allowedRoles = categoryMap[paymentCategory.toString()];
    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to validate this payment',
      );
    }
  }
}
