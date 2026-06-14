import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TrainingResource,
  TrainingResourceDocument,
} from './schemas/training-resource.schema';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import { User } from '../users/schemas/user.schema';
import {
  CreateTrainingResourceDto,
  UpdateTrainingResourceDto,
} from './dto/training-resource.dto';
import { FilterTrainingResourcesDto } from './dto/filter-training-resources.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginatedResult } from '../common/dto';

@Injectable()
export class TrainingResourcesService {
  private readonly logger = new Logger(TrainingResourcesService.name);

  constructor(
    @InjectModel(TrainingResource.name)
    private trainingResourceModel: Model<TrainingResourceDocument>,
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
      throw new NotFoundException('Profil d\'arbitre introuvable pour cet utilisateur');
    }
    return referee;
  }

  /**
   * Find resources targeted at a specific referee's category
   */
  async findResourcesForReferee(userId: string) {
    const referee = await this.getRefereeByUserId(userId);

    return this.trainingResourceModel
      .find({
        isActive: true,
        $or: [
          { targetAudience: { $in: [referee.category] } },
          { targetAudience: { $in: ['ALL'] } },
          { targetAudience: { $size: 0 } }, // Empty array means for everyone
        ],
      })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get recommended resources based on referee's category and performance areas
   * In a real implementation, this would analyze commissioner reports to identify weak areas
   */
  async getRecommendedResources(userId: string) {
    const referee = await this.getRefereeByUserId(userId);

    // For now, return recent resources for the referee's category
    // TODO: Integrate with statistics to find areas needing improvement
    return this.trainingResourceModel
      .find({
        isActive: true,
        $or: [
          { targetAudience: { $in: [referee.category] } },
          { targetAudience: { $in: ['ALL'] } },
        ],
      })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ viewCount: -1, averageRating: -1 }) // Most popular first
      .limit(10)
      .exec();
  }

  /**
   * Find personal resources assigned to a specific referee
   * User Story: Arbitre accède à des vidéos personnelles (ex: vidéos de ses propres matchs)
   */
  async findPersonalResourcesForReferee(userId: string) {
    const referee = await this.getRefereeByUserId(userId);

    return this.trainingResourceModel
      .find({
        isActive: true,
        isPersonal: true,
        targetRefereeIds: referee._id,
      })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(dto: CreateTrainingResourceDto, userId: string) {
    const resource = new this.trainingResourceModel({
      ...dto,
      uploadedBy: new Types.ObjectId(userId),
    });
    return await resource.save();
  }

  async findAll(
    filterDto: FilterTrainingResourcesDto,
  ): Promise<PaginatedResult<TrainingResource>> {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      targetAudience,
      search,
    } = filterDto;
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };

    if (type) query.type = type;
    if (category) query.categories = { $in: [category] };
    if (targetAudience) {
      query.targetCategories = { $in: [targetAudience] };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.trainingResourceModel
        .find(query)
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.trainingResourceModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const resource = await this.trainingResourceModel
      .findById(id)
      .populate('uploadedBy', 'firstName lastName email')
      .exec();

    if (!resource) {
      throw new NotFoundException(`La ressource de formation avec l'ID ${id} est introuvable`);
    }

    return resource;
  }

  async update(id: string, dto: UpdateTrainingResourceDto) {
    const resource = await this.trainingResourceModel
      .findByIdAndUpdate(
        id,
        { $set: dto, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!resource) {
      throw new NotFoundException(`Training resource with ID ${id} not found`);
    }

    return resource as any;
  }

  async remove(id: string) {
    const resource = await this.trainingResourceModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .exec();

    if (!resource) {
      throw new NotFoundException(`La ressource de formation avec l'ID ${id} est introuvable`);
    }

    return { message: 'Ressource supprimée avec succès' };
  }

  async incrementView(id: string) {
    const resource = await this.trainingResourceModel
      .findByIdAndUpdate(id, { $inc: { viewsCount: 1 } }, { new: true })
      .exec();

    if (!resource) {
      throw new NotFoundException(`La ressource de formation avec l'ID ${id} est introuvable`);
    }

    return resource as any;
  }

  async rateResource(id: string, userId: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('La note doit être comprise entre 1 et 5');
    }

    const resource = await this.trainingResourceModel.findById(id).exec();
    if (!resource) {
      throw new NotFoundException(`La ressource de formation avec l'ID ${id} est introuvable`);
    }

    // Check if user already rated
    const existingRatingIndex = resource.ratings.findIndex(
      (r: any) => r.userId.toString() === userId,
    );

    if (existingRatingIndex >= 0) {
      // Update existing rating
      resource.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      resource.ratings.push({
        userId: new Types.ObjectId(userId),
        rating,
      } as any);
    }

    // Recalculate average
    const totalRating = resource.ratings.reduce(
      (sum: number, r: { rating: number }) => sum + r.rating,
      0,
    );
    resource.averageRating = totalRating / resource.ratings.length;

    await resource.save();
    return resource;
  }

  async getStatistics() {
    const totalResources = await this.trainingResourceModel.countDocuments({
      isActive: true,
    });
    const totalViews = await this.trainingResourceModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    const byCategory = await this.trainingResourceModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const topRated = await this.trainingResourceModel
      .find({ isActive: true })
      .sort({ averageRating: -1, 'ratings.length': -1 })
      .limit(10)
      .select('title averageRating ratings views category')
      .exec();

    return {
      totalResources,
      totalViews: totalViews[0]?.total || 0,
      byCategory,
      topRated,
    };
  }

  /**
   * Notify referees about a new training resource
   * Implements User Story: Arbitre notifié quand nouvelle ressource formation ajoutée
   */
  async notifyRefereesAboutResource(
    resourceId: string,
    targetAudience?: string[],
    customMessage?: string,
  ): Promise<{ notified: number; failed: number }> {
    const resource = await this.findOne(resourceId);

    // Build query to find target referees
    const query: any = {};

    // Filter by target audience if specified
    if (
      targetAudience &&
      targetAudience.length > 0 &&
      !targetAudience.includes('ALL')
    ) {
      query.category = { $in: targetAudience };
    }

    // Find referees with their user info
    const referees = await this.refereeModel
      .find(query)
      .populate<{
        userId: User;
      }>('userId', 'firstName lastName email phoneNumber isActive')
      .exec();
      
    let notified = 0;
    let failed = 0;

    for (const referee of referees) {
      try {
        const user = referee.userId;
        if (!user || !user.isActive) continue;

        await this.notificationsService.notifyTrainingResource(
          (user as any)._id.toString(),
          user.phoneNumber || null,
          {
            resourceId: resource._id.toString(),
            title: resource.title,
            type: resource.type,
            description:
              customMessage || resource.description?.substring(0, 100),
          },
        );
        notified++;
      } catch (error) {
        this.logger.error(
          `Failed to notify referee ${referee._id.toString()}:`,
          error,
        );
        failed++;
      }
    }

    this.logger.log(
      `Training resource notification sent: ${notified} notified, ${failed} failed`,
    );

    return { notified, failed };
  }
}
