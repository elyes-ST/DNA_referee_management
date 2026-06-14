import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Designation, DesignationDocument } from './schemas/designation.schema';
import { Match, MatchDocument } from '../matches/schemas/match.schema';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import { DesignationValidationService } from './services/designation-validation.service';
import { RefereeMatchingService } from './services/referee-matching.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
  FilterDesignationsDto,
  ValidateDesignationDto,
  BulkAssignDto,
} from './dto/designation.dto';
import {
  DesignationStatus,
  RefereeDesignationStatus,
  Role,
} from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { getAllowedCategoriesForRole } from '../common/helpers';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectModel(Designation.name)
    private designationModel: Model<DesignationDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    private validationService: DesignationValidationService,
    private matchingService: RefereeMatchingService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) { }

  /**
   * Helper to get refereeId from userId
   */
  private async getRefereeIdByUserId(userId: string): Promise<Types.ObjectId> {
    const referee = await this.refereeModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!referee) {
      throw new NotFoundException('Profil d\'arbitre introuvable pour cet utilisateur');
    }
    return referee._id;
  }

  /**
   * Find designations by user ID (for arbitres viewing their own)
   */
  async findByRefereeUserId(userId: string): Promise<Designation[]> {
    const refereeId = await this.getRefereeIdByUserId(userId);
    return this.findByReferee(refereeId.toString());
  }

  /**
   * Find upcoming designations by user ID
   */
  async findUpcomingByRefereeUserId(userId: string): Promise<Designation[]> {
    const refereeId = await this.getRefereeIdByUserId(userId);
    return this.findUpcomingByReferee(refereeId.toString());
  }

  /**
   * Get all referees eligible to be designated for a given match and (optionally) a role.
   * Applies all designation validation rules and only returns referees who pass all hard rules.
   * Soft-rule warnings (workload) are attached per referee.
   * Each referee object includes the full userId (User) fields minus password.
   */
  async getEligibleReferees(
    matchId: string,
    role?: string,
    userRole?: string,
  ): Promise<{ referee: any; warnings: string[]; errors?: string[]; isEligible?: boolean }[]> {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException(`Match avec ID ${matchId} non trouvé`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(match.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder aux arbitres pour ce match");
    }

    // Load all active referees with their linked User fields
    const allReferees = await this.refereeModel
      .find({ isAvailable: true })
      .populate({ path: 'userId', select: '-password' })
      .exec();

    // Resolve team regions once for the match
    let homeTeamRegion: string | null = null;
    let awayTeamRegion: string | null = null;
    if (match.homeTeamId) {
      const homeTeam = await this.matchModel.db
        .model('Team')
        .findById(match.homeTeamId)
        .select('region')
        .lean();
      if (homeTeam) homeTeamRegion = (homeTeam as any).region;
    }
    if (match.awayTeamId) {
      const awayTeam = await this.matchModel.db
        .model('Team')
        .findById(match.awayTeamId)
        .select('region')
        .lean();
      if (awayTeam) awayTeamRegion = (awayTeam as any).region;
    }

    const eligible: { referee: any; warnings: string[]; errors?: string[]; isEligible?: boolean }[] = [];

    for (const referee of allReferees) {
      const refereeId = (referee._id as Types.ObjectId).toString();
      const errors: string[] = [];
      const warnings: string[] = [];

      // 1. Journée conflict (already assigned to this round)
      const hasJourneeConflict =
        await this.validationService.checkJourneeConflict(
          refereeId,
          match.journee,
          match.saison,
          match.competition,
          matchId,
        );
      if (hasJourneeConflict) {
        errors.push(`Déjà désigné à la journée ${match.journee}`);
      }

      // 2. Double-booking same day
      const hasDoubleBooking = await this.validationService.checkDoubleBooking(
        refereeId,
        match.date,
        matchId,
      );
      if (hasDoubleBooking) {
        errors.push(`Déjà désigné le ${match.date.toLocaleDateString('fr-FR')}`);
      }

      // 3. Declared availability
      const isAvailable = await this.validationService.checkAvailability(
        refereeId,
        match.date,
      );
      if (!isAvailable) {
        errors.push('Indisponible à cette date');
      }

      // 4. Category eligibility
      const isEligible = await this.validationService.checkCategoryEligibility(
        refereeId,
        match.category || '',
      );
      if (!isEligible) {
        warnings.push('Catégorie insuffisante pour ce match');
      }

      // 5. Region conflict of interest
      const hasRegionConflict = this.validationService.checkRegionConflict(
        referee.region,
        homeTeamRegion,
        awayTeamRegion,
      );
      if (hasRegionConflict) {
        errors.push(
          `Conflit régional: arbitre de ${referee.region} ne peut pas officier ce match`,
        );
      }

      // 6 & 7. Role eligibility + VAR certification (only when role is specified)
      if (role) {
        const canPlayRole = this.validationService.checkRoleEligibility(
          referee,
          role as any,
        );
        if (!canPlayRole) {
          errors.push(`Non habilité pour le rôle ${role}`);
        }

        if (
          (role === 'ARBITRE_VAR' || role === 'ASSISTANT_VAR') &&
          !referee.isVARCertified
        ) {
          errors.push(`Certification VAR requise pour le rôle ${role}`);
        }
      }

      // 8. Workload limit (soft rule → warning only, referee is still returned)
      const monthStart = new Date(match.date);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(match.date);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      const withinWorkload = await this.validationService.checkWorkloadLimit(
        refereeId,
        { start: monthStart, end: monthEnd },
      );
      if (!withinWorkload) {
        warnings.push('Limite de matchs du mois atteinte');
      }

      // Include ALL referees, but mark their eligibility
      eligible.push({
        referee: referee.toObject(),
        warnings,
        errors,
        isEligible: errors.length === 0,
      });
    }

    return eligible;
  }

  async create(
    createDto: CreateDesignationDto,
    userId: string,
    userRole?: string,
  ): Promise<{ designation: Designation; warnings: string[] }> {
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(createDto.category)) {
      throw new ForbiddenException(`Vous n'êtes pas autorisé à créer une désignation pour la catégorie ${createDto.category}`);
    }
    const match = await this.matchModel.findById(createDto.matchId);
    if (!match) {
      throw new NotFoundException(
        `Match avec ID ${createDto.matchId} non trouvé`,
      );
    }

    const existingDesignation = await this.designationModel.findOne({
      matchId: new Types.ObjectId(createDto.matchId),
    });
    if (existingDesignation) {
      throw new BadRequestException(
        'Une désignation existe déjà pour ce match',
      );
    }

    const validation = await this.validationService.validateDesignationRules(
      createDto,
      createDto.matchId,
    );
    if (!validation.valid) {
      throw new BadRequestException(
        `Erreurs de validation: ${validation.errors.join('; ')}`,
      );
    }

    const referees = createDto.referees.map((ref) => ({
      refereeId: new Types.ObjectId(ref.refereeId),
      role: ref.role,
      status: RefereeDesignationStatus.PROPOSED,
      proposedBy: new Types.ObjectId(userId),
      proposedAt: new Date(),
    }));

    const designation = await this.designationModel.create({
      matchId: new Types.ObjectId(createDto.matchId),
      referees,
      designatedBy: new Types.ObjectId(userId),
      status: DesignationStatus.DRAFT,
      category: createDto.category,
      notes: createDto.notes,
    });

    // Sync referee list into match.designations[]
    await this.syncMatchDesignations(designation);

    return { designation, warnings: validation.warnings || [] };
  }

  /**
   * Keep Match.designations[] in sync with the Designation's referees.
   * Called after create, update (when referees change), and remove.
   */
  private async syncMatchDesignations(
    designation: DesignationDocument,
  ): Promise<void> {
    const matchDesignations = designation.referees.map((ref) => ({
      refereeId: ref.refereeId,
      role: ref.role,
      confirmed: ref.status === RefereeDesignationStatus.CONFIRMED,
    }));

    await this.matchModel.findByIdAndUpdate(
      designation.matchId,
      {
        $set: {
          designationId: designation._id,
          designationStatus: designation.status,
          designations: matchDesignations,
        },
      },
      { new: true },
    );
  }

  /**
   * Send notifications to referees when designated
   */
  private async sendDesignationNotifications(
    designation: DesignationDocument,
    match: MatchDocument,
  ): Promise<void> {
    const matchDate = match.date
      ? new Date(match.date).toLocaleDateString('fr-FR')
      : 'Date non définie';
    const matchTime = match.time || '00:00';

    for (const refAssignment of designation.referees) {
      const referee = await this.refereeModel
        .findById(refAssignment.refereeId)
        .populate('userId');

      if (!referee || !referee.userId) continue;

      const userIdField = referee.userId as any;
      const userId = userIdField._id?.toString() || userIdField.toString();
      const phone = userIdField.phoneNumber || null;
      const refereeName =
        `${userIdField.firstName || ''} ${userIdField.lastName || ''}`.trim() ||
        'Arbitre';

      await this.notificationsService.notifyDesignation(userId, phone, {
        refereeName,
        team1: match.homeTeam || 'Équipe A',
        team2: match.awayTeam || 'Équipe B',
        date: matchDate,
        time: matchTime,
        venue: match.stadium || 'Stade non défini',
        role: refAssignment.role,
        matchId: match._id.toString(),
        designationId: designation._id.toString(),
      });
    }
  }

  async findAll(filterDto: FilterDesignationsDto, userRole?: string): Promise<any> {
    const filter: any = {};
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;

    if (filterDto.status) filter.status = filterDto.status;
    if (filterDto.category && filterDto.category.length > 0) {
      const requestedCategories = Array.isArray(filterDto.category) ? filterDto.category : [filterDto.category];
      if (allowedCategories) {
        filter.category = { $in: requestedCategories.filter(c => allowedCategories.includes(c)) };
      } else {
        filter.category = { $in: requestedCategories };
      }
    } else if (allowedCategories) {
      filter.category = { $in: allowedCategories };
    }

    if (filterDto.date || filterDto.journee || filterDto.saison) {
      const matchFilter: any = {};
      if (filterDto.date) {
        const targetDate = new Date(filterDto.date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        matchFilter.date = { $gte: startOfDay, $lte: endOfDay };
      }
      if (filterDto.journee) matchFilter.journee = filterDto.journee;
      if (filterDto.saison) matchFilter.saison = filterDto.saison;

      const matches = await this.matchModel.find(matchFilter).select('_id');
      const matchIds = matches.map((m) => m._id);
      filter.matchId = { $in: matchIds };
    }

    const baseQuery = this.designationModel
      .find(filter)
      .populate('matchId')
      .populate({
        path: 'referees.refereeId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('designatedBy', 'nom prenom')
      .populate('validatedBy', 'nom prenom')
      .sort({ createdAt: -1 });

    // Paginate when page/limit are provided
    if (filterDto.page && filterDto.limit) {
      const page  = filterDto.page;
      const limit = filterDto.limit;
      const skip  = (page - 1) * limit;
      const total = await this.designationModel.countDocuments(filter);
      const data  = await baseQuery.skip(skip).limit(limit).exec();
      return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    // Backward-compatible: return array directly when no pagination requested
    return baseQuery.exec();
  }

  async findOne(id: string, userRole?: string): Promise<Designation> {
    const designation = await this.designationModel
      .findById(id)
      .populate('matchId')
      .populate({
        path: 'referees.refereeId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('designatedBy', '-password')
      .populate('validatedBy', '-password')
      .exec();

    if (!designation) {
      throw new NotFoundException(`La désignation avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(designation.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à cette désignation");
    }

    return designation;
  }

  async findByMatch(matchId: string, userRole?: string): Promise<Designation | null> {
    const designation = await this.designationModel
      .findOne({ matchId: new Types.ObjectId(matchId) })
      .populate('matchId')
      .populate({
        path: 'referees.refereeId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('designatedBy', 'nom prenom')
      .populate('validatedBy', 'nom prenom')
      .exec();

    if (designation && userRole) {
      const allowedCategories = getAllowedCategoriesForRole(userRole);
      if (allowedCategories && !allowedCategories.includes(designation.category)) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à voir les désignations de ce match");
      }
    }

    return designation;
  }

  async findByReferee(refereeId: string): Promise<Designation[]> {
    return this.designationModel
      .find({ 'referees.refereeId': new Types.ObjectId(refereeId) })
      .populate('matchId')
      .populate({
        path: 'referees.refereeId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('designatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUpcomingByReferee(refereeId: string): Promise<Designation[]> {
    const now = new Date();

    const upcomingMatches = await this.matchModel
      .find({ date: { $gte: now } })
      .select('_id')
      .exec();

    const matchIds = upcomingMatches.map((m) => m._id);

    return this.designationModel
      .find({
        'referees.refereeId': new Types.ObjectId(refereeId),
        matchId: { $in: matchIds },
      })
      .populate('matchId')
      .populate({
        path: 'referees.refereeId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .sort({ 'matchId.date': 1 })
      .exec();
  }

  async update(
    id: string,
    updateDto: UpdateDesignationDto,
    userId: string,
    userRole?: string,
  ): Promise<{ designation: Designation; warnings: string[] }> {
    const designation = await this.designationModel.findById(id).exec();
    if (!designation) {
      throw new NotFoundException(`Désignation avec ID ${id} non trouvée`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(designation.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette désignation");
    }

    if (updateDto.referees) {
      const validation = await this.validationService.validateDesignationRules(
        { ...updateDto, matchId: designation.matchId.toString() } as any,
        designation.matchId.toString(),
      );
      if (!validation.valid) {
        throw new BadRequestException(
          `Erreurs de validation: ${validation.errors.join('; ')}`,
        );
      }

      designation.referees = updateDto.referees.map((ref) => ({
        refereeId: new Types.ObjectId(ref.refereeId),
        role: ref.role,
        status: RefereeDesignationStatus.PROPOSED,
        proposedBy: new Types.ObjectId(userId),
        proposedAt: new Date(),
      })) as any;
    }

    if (updateDto.notes !== undefined) {
      designation.notes = updateDto.notes;
    }

    const saved = await designation.save();

    // Re-sync match.designations[] whenever the referees list was updated
    if (updateDto.referees) {
      await this.syncMatchDesignations(saved as unknown as DesignationDocument);
    }

    return { designation: saved, warnings: [] };
  }

  async submit(id: string, userRole?: string): Promise<Designation> {
    const designation = await this.designationModel.findById(id).exec();
    if (!designation) {
      throw new NotFoundException(`Désignation avec ID ${id} non trouvée`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(designation.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à soumettre cette désignation");
    }

    if (designation.status !== DesignationStatus.DRAFT) {
      throw new BadRequestException('Only draft designations can be submitted');
    }

    designation.status = DesignationStatus.SUBMITTED;
    const submitted = await designation.save();
    // Sync updated status into match.designations[]
    await this.syncMatchDesignations(submitted as unknown as DesignationDocument);
    return submitted;
  }

  async validate(
    id: string,
    userId: string,
    userRole: Role,
    dto: ValidateDesignationDto,
  ): Promise<Designation> {
    const designation = await this.designationModel.findById(id);
    if (!designation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }

    if (designation.status !== DesignationStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only submitted designations can be validated',
      );
    }

    const permission = this.validationService.checkValidationPermission(
      designation.category,
      userRole,
    );
    if (!permission.allowed) {
      throw new ForbiddenException(permission.reason);
    }

    designation.status = DesignationStatus.VALIDATED;
    designation.validatedBy = new Types.ObjectId(userId);
    if (dto.notes) {
      designation.notes = designation.notes
        ? `${designation.notes}\n${dto.notes}`
        : dto.notes;
    }

    const savedDesignation = await designation.save();

    // Sync updated status into match.designations[]
    await this.syncMatchDesignations(savedDesignation as unknown as DesignationDocument);

    const match = await this.matchModel.findById(designation.matchId);
    if (match) {
      this.sendDesignationNotifications(savedDesignation, match).catch(
        (err) => {
          console.error('Error sending validation notifications:', err);
        },
      );
    }

    return savedDesignation;
  }

  async remove(id: string, userRole?: string): Promise<void> {
    const designation = await this.designationModel.findById(id).exec();
    if (!designation) {
      throw new NotFoundException(`Désignation avec ID ${id} non trouvée`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(designation.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cette désignation");
    }

    if (designation.status !== DesignationStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted designations can be deleted');
    }

    // Clear designations from the match before removing the designation document
    await this.matchModel.findByIdAndUpdate(
      designation.matchId,
      { $set: { designations: [] } },
    );

    await designation.deleteOne();
  }

  async sendNotifications(id: string): Promise<Designation> {
    const designation = await this.designationModel
      .findById(id)
      .populate('referees.refereeId');

    if (!designation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }

    if (designation.status !== DesignationStatus.VALIDATED) {
      throw new BadRequestException(
        'Can only send notifications for validated designations',
      );
    }

    const match = await this.matchModel.findById(designation.matchId);
    if (!match) {
      throw new NotFoundException('Match not found for this designation');
    }

    await this.sendDesignationNotifications(designation, match);

    designation.notificationsSent = true;
    return designation.save();
  }

  async getCalendar(saison?: string, month?: string, userRole?: string): Promise<any[]> {
    const matchFilter: any = { saison };
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories) {
      matchFilter.category = { $in: allowedCategories };
    }

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      matchFilter.date = { $gte: startDate, $lt: endDate };
    }

    const matches = await this.matchModel.find(matchFilter).sort({ date: 1 });

    const calendar: any[] = [];
    for (const match of matches) {
      const designation = await this.designationModel
        .findOne({ matchId: match._id })
        .populate('referees.refereeId', 'nom prenom')
        .exec();

      calendar.push({
        match,
        designation,
      });
    }

    return calendar;
  }

  async bulkAssign(
    dto: BulkAssignDto,
    userId: string,
  ): Promise<{ created: number; failed: string[]; createdIds: string[] }> {
    const failed: string[] = [];
    const createdIds: string[] = [];
    let created = 0;

    for (const designation of dto.designations) {
      try {
        const result = await this.create(designation, userId);
        created++;
        createdIds.push((result.designation as any)._id.toString());
      } catch (error) {
        failed.push(`${designation.matchId}: ${error.message}`);
      }
    }

    return { created, failed, createdIds };
  }
}
