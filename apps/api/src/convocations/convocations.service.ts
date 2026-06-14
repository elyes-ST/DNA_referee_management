import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Convocation, ConvocationDocument } from './schemas/convocation.schema';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import { User } from '../users/schemas/user.schema';
import {
  CreateConvocationDto,
  UpdateConvocationDto,
  AddSeminarNoteDto,
  FilterConvocationsDto,
} from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginatedResult } from '../common/dto';

@Injectable()
export class ConvocationsService {
  constructor(
    @InjectModel(Convocation.name)
    private convocationModel: Model<ConvocationDocument>,
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    @InjectModel('User') private userModel: Model<User>,
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
   * Find convocations by user ID (for arbitres viewing their own)
   */
  async findByRefereeUserId(userId: string): Promise<Convocation[]> {
    const refereeId = await this.getRefereeIdByUserId(userId);
    return this.convocationModel
      .find({ referees: refereeId })
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 })
      .exec();
  }

  /**
   * Find upcoming convocations for a referee
   */
  async findUpcomingByRefereeUserId(userId: string): Promise<Convocation[]> {
    const refereeId = await this.getRefereeIdByUserId(userId);
    const now = new Date();
    return this.convocationModel
      .find({
        referees: refereeId,
        date: { $gte: now },
      })
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 })
      .exec();
  }

  async create(
    createConvocationDto: CreateConvocationDto,
    createdBy: string,
  ): Promise<Convocation> {
    const createdConvocation = new this.convocationModel({
      ...createConvocationDto,
      createdBy,
    });
    return createdConvocation.save();
  }

  async findAll(
    filterDto: FilterConvocationsDto,
  ): Promise<PaginatedResult<Convocation>> {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      startDate,
      endDate,
    } = filterDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.convocationModel
        .find(filter)
        .populate({ path: 'referees', populate: { path: 'userId', select: '-password' } })
        .populate('createdBy', '-password')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.convocationModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Convocation> {
    const convocation = await this.convocationModel
      .findById(id)
      .populate({ path: 'referees', populate: { path: 'userId', select: '-password' } })
      .populate('attendanceList.refereeId')
      .populate('createdBy', '-password')
      .exec();
    if (!convocation) {
      throw new NotFoundException(`La convocation avec l'ID ${id} est introuvable`);
    }
    return convocation;
  }

  async update(
    id: string,
    updateConvocationDto: UpdateConvocationDto,
  ): Promise<Convocation> {
    const updatedConvocation = await this.convocationModel
      .findByIdAndUpdate(id, updateConvocationDto, { new: true })
      .populate({ path: 'referees', populate: { path: 'userId', select: '-password' } })
      .populate('createdBy', '-password')
      .exec();

    if (!updatedConvocation) {
      throw new NotFoundException(`La convocation avec l'ID ${id} est introuvable`);
    }

    return updatedConvocation;
  }

  async remove(id: string): Promise<void> {
    const result = await this.convocationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`La convocation avec l'ID ${id} est introuvable`);
    }
  }

  async addSeminarNote(
    id: string,
    addSeminarNoteDto: AddSeminarNoteDto,
  ): Promise<Convocation> {
    const convocation = await this.convocationModel.findById(id);
    if (!convocation) {
      throw new NotFoundException(`La convocation avec l'ID ${id} est introuvable`);
    }

    // Update attendance list
    const attendanceIndex = convocation.attendanceList.findIndex(
      (a) => a.refereeId.toString() === addSeminarNoteDto.refereeId,
    );

    if (attendanceIndex >= 0) {
      convocation.attendanceList[attendanceIndex].note = addSeminarNoteDto.note;
      convocation.attendanceList[attendanceIndex].attended = true;
    } else {
      convocation.attendanceList.push({
        refereeId: new Types.ObjectId(addSeminarNoteDto.refereeId),
        attended: true,
        note: addSeminarNoteDto.note,
      });
    }

    await convocation.save();

    // Add seminar note to referee
    const referee = await this.refereeModel.findById(
      addSeminarNoteDto.refereeId,
    );
    if (referee) {
      referee.seminarNotes.push({
        seminarId: new Types.ObjectId(id),
        note: addSeminarNoteDto.note,
        date: convocation.date,
      });
      await referee.save();
    }

    const result = await this.convocationModel
      .findById(id)
      .populate({ path: 'referees', populate: { path: 'userId', select: '-password' } })
      .populate('attendanceList.refereeId')
      .exec();
    if (!result) {
      throw new NotFoundException(`La convocation avec l'ID ${id} est introuvable`);
    }
    return result;
  }

  async sendNotifications(id: string): Promise<Convocation> {
    const convocation = await this.convocationModel
      .findById(id)
      .populate('referees');
    if (!convocation) {
      throw new NotFoundException(`La convocation avec l'ID ${id} est introuvable`);
    }

    // Send notifications to all convoked referees
    await this.sendConvocationNotifications(convocation);

    convocation.notificationSent = true;
    await convocation.save();

    const result = await this.convocationModel
      .findById(id)
      .populate({ path: 'referees', populate: { path: 'userId', select: '-password' } })
      .populate('createdBy', '-password')
      .exec();
    if (!result) {
      throw new NotFoundException(`La convocation avec l'ID ${id} est introuvable`);
    }
    return result;
  }

  /**
   * Send notifications to all referees in a convocation
   * Uses the ready-to-use helper from NotificationsService
   */
  private async sendConvocationNotifications(
    convocation: ConvocationDocument,
  ): Promise<void> {
    const convocationDate = convocation.date
      ? new Date(convocation.date).toLocaleDateString('fr-FR')
      : 'Date non définie';
    const convocationTime = (convocation as any).startTime || '00:00';

    // Map event type to readable label
    const eventTypeLabels: Record<string, string> = {
      SEMINAR: 'Séminaire',
      MEETING: 'Réunion',
      TRAINING: 'Formation',
      EVALUATION: 'Évaluation',
      OTHER: 'Autre',
    };
    const eventType = eventTypeLabels[convocation.type] || convocation.type;

    for (const refereeData of convocation.referees) {
      const refereeId = refereeData._id || refereeData;

      // Get referee with user info
      const referee = await this.refereeModel
        .findById(refereeId)
        .populate('userId');

      if (!referee || !referee.userId) continue;

      const userIdField = referee.userId as any;
      const userId = userIdField._id?.toString() || userIdField.toString();
      const phone = userIdField.phoneNumber || null;
      const refereeName =
        `${userIdField.firstName || ''} ${userIdField.lastName || ''}`.trim() ||
        'Arbitre';

      // Use the ready-to-use helper
      await this.notificationsService.notifyConvocation(userId, phone, {
        refereeName,
        eventType,
        title: convocation.title || 'Convocation',
        date: convocationDate,
        time: convocationTime,
        venue: convocation.location || 'Lieu non précisé',
        convocationId: convocation._id.toString(),
      });
    }
  }
}
