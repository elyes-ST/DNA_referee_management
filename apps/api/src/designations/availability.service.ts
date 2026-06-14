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
import {
  Availability,
  AvailabilityDocumentType,
} from './schemas/availability.schema';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import {
  CreateAvailabilityDto,
  ApproveAvailabilityDto,
  RejectAvailabilityDto,
  ReportMyUnavailabilityDto,
} from './dto/availability.dto';
import {
  AvailabilityStatus,
  AvailabilityUrgency,
  AvailabilityType,
} from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/enums';
import { User } from '../users/schemas/user.schema';
import { getAllowedCategoriesForRole } from '../common/helpers';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocumentType>,
    @InjectModel(Referee.name)
    private refereeModel: Model<RefereeDocument>,
    @InjectModel('User')
    private userModel: Model<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Helper to get referee by userId
   */
  private async getRefereeByUserId(userId: string): Promise<RefereeDocument> {
    const referee = await this.refereeModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!referee) {
      throw new NotFoundException('Referee profile not found for this user');
    }
    return referee;
  }

  /**
   * Report own unavailability (for ARBITRE role)
   * Implements user story: referee informs CRA about injury/excuse
   */
  async reportMyUnavailability(
    userId: string,
    dto: ReportMyUnavailabilityDto,
  ): Promise<Availability> {
    const referee = await this.getRefereeByUserId(userId);

    const availability = await this.availabilityModel.create({
      refereeId: referee._id,
      dateFrom: new Date(dto.dateFrom),
      dateTo: new Date(dto.dateTo),
      type: dto.type,
      reason: dto.reason,
      urgency: dto.urgency || AvailabilityUrgency.NORMAL,
      reportedBy: new Types.ObjectId(userId),
      status: AvailabilityStatus.PENDING,
      notifyCRA: true, // Always notify CRA when referee reports directly
      craRegion: referee.region,
      craNotified: false,
    });

    // Send notification to CRA president of the referee's region
    this.notifyCRAAboutUnavailability(availability, referee).catch((err) => {
      console.error('Error notifying CRA:', err);
    });

    return this.availabilityModel
      .findById(availability._id)
      .populate('refereeId', 'matricule')
      .exec() as Promise<Availability>;
  }

  /**
   * Notify CRA president about referee unavailability
   * Uses the ready-to-use helper from NotificationsService
   */
  private async notifyCRAAboutUnavailability(
    availability: AvailabilityDocumentType,
    referee: RefereeDocument,
  ): Promise<void> {
    // Find CRA president for the referee's region
    const craUsers = await this.userModel.find({
      role: 'CRA',
      isActive: true,
    });

    // Get referee's user info for the name
    const refereeUser = await this.userModel.findById(referee.userId);
    const refereeName = refereeUser
      ? `${refereeUser.firstName || ''} ${refereeUser.lastName || ''}`.trim()
      : referee.matricule || 'Arbitre';

    const dateFrom = new Date(availability.dateFrom).toLocaleDateString(
      'fr-FR',
    );
    const dateTo = new Date(availability.dateTo).toLocaleDateString('fr-FR');

    // Map availability type to readable string
    const typeLabels: Record<string, string> = {
      [AvailabilityType.INJURED]: 'Blessure',
      [AvailabilityType.SICK]: 'Maladie',
      [AvailabilityType.EXCUSED]: 'Excuse',
      [AvailabilityType.PERSONAL]: 'Raison personnelle',
      [AvailabilityType.UNAVAILABLE]: 'Indisponibilité',
      [AvailabilityType.SUSPENDED]: 'Suspension',
    };
    const typeLabel = typeLabels[availability.type] || availability.type;

    for (const cra of craUsers) {
      const craName =
        `${cra.firstName || ''} ${cra.lastName || ''}`.trim() || 'CRA';
      const craPhone = cra.phoneNumber || null;

      // Use the ready-to-use helper
      await this.notificationsService.notifyExcuseToCRA(
        cra._id.toString(),
        craPhone,
        {
          craName,
          refereeName,
          refereeMatricule: referee.matricule || 'N/A',
          type: typeLabel,
          reason: availability.reason || 'Non précisé',
          dateFrom,
          dateTo,
          availabilityId: availability._id.toString(),
          refereeId: referee._id.toString(),
        },
      );
    }

    // Update availability to mark CRA as notified
    await this.availabilityModel.findByIdAndUpdate(availability._id, {
      craNotified: true,
      craNotifiedAt: new Date(),
    });
  }

  /**
   * Get unavailability reports for CRA to review
   */
  async findPendingForCRA(region: string): Promise<Availability[]> {
    return this.availabilityModel
      .find({
        craRegion: region,
        notifyCRA: true,
        status: AvailabilityStatus.PENDING,
      })
      .populate('refereeId')
      .populate('reportedBy', 'firstName lastName')
      .sort({ urgency: -1, createdAt: -1 }) // Urgent first
      .exec();
  }

  /**
   * Get my own unavailability reports
   */
  async findMyUnavailability(userId: string): Promise<Availability[]> {
    const referee = await this.getRefereeByUserId(userId);
    return this.availabilityModel
      .find({ refereeId: referee._id })
      .sort({ dateFrom: -1 })
      .exec();
  }

  async create(
    createDto: CreateAvailabilityDto,
    userId: string,
    userRole?: string,
  ): Promise<Availability> {
    const referee = await this.refereeModel.findById(createDto.refereeId).exec();
    if (!referee) {
      throw new NotFoundException(`Referee with ID ${createDto.refereeId} not found`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à créer une disponibilité pour cet arbitre");
    }

    return this.availabilityModel.create({
      ...createDto,
      refereeId: new Types.ObjectId(createDto.refereeId),
      dateFrom: new Date(createDto.dateFrom),
      dateTo: new Date(createDto.dateTo),
      reportedBy: new Types.ObjectId(userId),
      status: AvailabilityStatus.PENDING,
      urgency: createDto.urgency || AvailabilityUrgency.NORMAL,
      notifyCRA: createDto.notifyCRA ?? true,
    });
  }

  async findAll(userRole?: string): Promise<Availability[]> {
    const filter: any = {};
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories) {
      const allowedReferees = await this.refereeModel.find({ category: { $in: allowedCategories } }).select('_id').exec();
      filter.refereeId = { $in: allowedReferees.map(r => r._id) };
    }

    return this.availabilityModel
      .find(filter)
      .populate('refereeId', 'nom prenom')
      .populate('reportedBy', 'nom prenom')
      .populate('approvedBy', 'nom prenom')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByReferee(refereeId: string, userRole?: string): Promise<Availability[]> {
    const referee = await this.refereeModel.findById(refereeId).exec();
    if (!referee) {
      throw new NotFoundException(`Referee not found`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à voir les disponibilités de cet arbitre");
    }

    return this.availabilityModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .sort({ dateFrom: 1 })
      .exec();
  }

  async findByDate(date: string, userRole?: string): Promise<Availability[]> {
    const targetDate = new Date(date);
    const filter: any = {
      dateFrom: { $lte: targetDate },
      dateTo: { $gte: targetDate },
      status: AvailabilityStatus.APPROVED,
    };

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories) {
      const allowedReferees = await this.refereeModel.find({ category: { $in: allowedCategories } }).select('_id').exec();
      filter.refereeId = { $in: allowedReferees.map(r => r._id) };
    }

    return this.availabilityModel
      .find(filter)
      .populate('refereeId', 'nom prenom')
      .exec();
  }

  async approve(
    id: string,
    userId: string,
    dto: ApproveAvailabilityDto,
    userRole?: string,
  ): Promise<Availability> {
    const availability = await this.availabilityModel.findById(id).populate('refereeId').exec();
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    const referee = availability.refereeId as any as RefereeDocument;
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee?.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à approuver la disponibilité de cet arbitre");
    }

    availability.status = AvailabilityStatus.APPROVED;
    availability.approvedBy = new Types.ObjectId(userId);

    // If CRA provides a response message, store it
    if (dto.response) {
      availability.craResponse = dto.response;
      availability.craRespondedBy = new Types.ObjectId(userId);
      availability.craNotifiedAt = new Date();
    }

    return availability.save();
  }

  async reject(
    id: string,
    userId: string,
    dto: RejectAvailabilityDto,
    userRole?: string,
  ): Promise<Availability> {
    const availability = await this.availabilityModel.findById(id).populate('refereeId').exec();
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    const referee = availability.refereeId as any as RefereeDocument;
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee?.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à rejeter la disponibilité de cet arbitre");
    }

    availability.status = AvailabilityStatus.REJECTED;
    availability.reason = availability.reason
      ? `${availability.reason}\nRejection: ${dto.reason}`
      : `Rejection: ${dto.reason}`;

    return availability.save();
  }

  async remove(id: string, userRole?: string): Promise<void> {
    const availability = await this.availabilityModel.findById(id).populate('refereeId').exec();
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    const referee = availability.refereeId as any as RefereeDocument;
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee?.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer la disponibilité de cet arbitre");
    }

    await this.availabilityModel.findByIdAndDelete(id);
  }

  async findActive(userRole?: string): Promise<Availability[]> {
    const now = new Date();
    const filter: any = {
      dateFrom: { $lte: now },
      dateTo: { $gte: now },
      status: AvailabilityStatus.APPROVED,
    };

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories) {
      const allowedReferees = await this.refereeModel.find({ category: { $in: allowedCategories } }).select('_id').exec();
      filter.refereeId = { $in: allowedReferees.map(r => r._id) };
    }

    return this.availabilityModel
      .find(filter)
      .populate('refereeId', 'nom prenom')
      .exec();
  }

  /**
   * CRA forwards an approved unavailability report to ADMIN_DNA.
   * Sends an in-app notification to all active Admin DNA users.
   * Implements Epic 5: CRA transmit injury/excuse info to DNA.
   */
  async forwardToDna(
    availabilityId: string,
    craUserId: string,
  ): Promise<{ forwarded: boolean; notifiedAdmins: number }> {
    const availability = await this.availabilityModel
      .findById(availabilityId)
      .populate('refereeId')
      .exec();

    if (!availability) {
      throw new NotFoundException(
        `Availability record with ID ${availabilityId} not found`,
      );
    }

    if (availability.status !== AvailabilityStatus.APPROVED) {
      throw new BadRequestException(
        'Only APPROVED unavailability reports can be forwarded to DNA',
      );
    }

    // Gather referee info for the notification message
    const referee = availability.refereeId as any;
    const refereeUser = await this.userModel.findById(referee?.userId);
    const refereeName = refereeUser
      ? `${refereeUser.firstName || ''} ${refereeUser.lastName || ''}`.trim()
      : referee?.matricule || 'Arbitre';
    const refereeMatricule = referee?.matricule || 'N/A';

    const craUser = await this.userModel.findById(craUserId);
    const craName = craUser
      ? `${craUser.firstName || ''} ${craUser.lastName || ''}`.trim()
      : 'CRA';

    const dateFrom = new Date(availability.dateFrom).toLocaleDateString('fr-FR');
    const dateTo = new Date(availability.dateTo).toLocaleDateString('fr-FR');

    // Map availability type to readable label
    const typeLabels: Record<string, string> = {
      INJURED: 'Blessure',
      SICK: 'Maladie',
      EXCUSED: 'Excuse',
      PERSONAL: 'Raison personnelle',
      UNAVAILABLE: 'Indisponibilité',
      SUSPENDED: 'Suspension',
    };
    const typeLabel = typeLabels[availability.type] || availability.type;

    // Find all active ADMIN_DNA users to notify
    const adminUsers = await this.userModel.find({
      role: 'ADMIN_DNA',
      isActive: true,
    });

    let notifiedAdmins = 0;
    for (const admin of adminUsers) {
      try {
        await this.notificationsService.notifyExcuseToCRA(
          admin._id.toString(),
          admin.phoneNumber || null,
          {
            craName: `DNA (transmis par ${craName})`,
            refereeName,
            refereeMatricule,
            type: typeLabel,
            reason: availability.reason || 'Non précisé',
            dateFrom,
            dateTo,
            availabilityId: availability._id.toString(),
            refereeId: referee?._id?.toString(),
          },
        );
        notifiedAdmins++;
      } catch (err) {
        // Log but don't block — partial success is acceptable
        console.error(`Failed to notify admin ${admin._id}: ${err.message}`);
      }
    }

    // Mark the record as forwarded to DNA
    await this.availabilityModel.findByIdAndUpdate(availabilityId, {
      $set: {
        dnaForwarded: true,
        dnaForwardedAt: new Date(),
        dnaForwardedBy: new Types.ObjectId(craUserId),
      },
    });

    return { forwarded: true, notifiedAdmins };
  }
}
