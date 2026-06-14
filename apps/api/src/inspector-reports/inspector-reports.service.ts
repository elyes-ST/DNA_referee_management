import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InspectorReport,
  InspectorReportDocument,
} from './schemas/inspector-report.schema';
import {
  CreateInspectorReportDto,
  UpdateInspectorReportDto,
} from './dto/inspector-report.dto';
import { InspectorReportStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class InspectorReportsService {
  constructor(
    @InjectModel(InspectorReport.name)
    private inspectorReportModel: Model<InspectorReportDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) { }

  async create(dto: CreateInspectorReportDto, userId: string) {
    // Calculate overall score as weighted average
    const overallScore = this.calculateOverallScore(dto.scores);

    const report = new this.inspectorReportModel({
      ...dto,
      inspectorId: new Types.ObjectId(dto.inspectorId),
      refereeId: new Types.ObjectId(dto.refereeId),
      matchId: new Types.ObjectId(dto.matchId),
      overallScore,
      reportedBy: new Types.ObjectId(userId),
      status: InspectorReportStatus.DRAFT,
    });

    return report.save();
  }

  async findAll(filters: any = {}) {
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.max(1, parseInt(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters.inspectorId) {
      query.inspectorId = new Types.ObjectId(filters.inspectorId);
    }
    if (filters.refereeId) {
      query.refereeId = new Types.ObjectId(filters.refereeId);
    }
    if (filters.inspectionType) {
      query.inspectionType = filters.inspectionType;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      query.inspectionDate = {};
      if (filters.dateFrom)
        query.inspectionDate.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.inspectionDate.$lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.inspectorReportModel
        .find(query)
        .populate({
          path: 'inspectorId',
          select: 'matricule region specialization',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .populate({
          path: 'refereeId',
          select: 'matricule nom prenom category region',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .populate('matchId', 'matchNumber homeTeam awayTeam date competition')
        .populate('reportedBy', 'firstName lastName email role')
        .sort({ inspectionDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.inspectorReportModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async findByReferee(refereeId: string) {
    const reports = await this.inspectorReportModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .populate({
        path: 'inspectorId',
        select: 'matricule region specialization',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('matchId', 'matchNumber homeTeam awayTeam date competition')
      .sort({ inspectionDate: -1 })
      .exec();

    if (reports.length === 0) {
      return {
        reports: [],
        summary: {
          totalReports: 0,
          averageScore: 0,
          trend: 'no_data',
        },
      };
    }

    // Calculate progression trend
    const recentReports = reports.slice(0, Math.min(3, reports.length));
    const olderReports = reports.slice(Math.max(0, reports.length - 3));

    const recentAvg = this.average(recentReports.map((r) => r.overallScore));
    const olderAvg = this.average(olderReports.map((r) => r.overallScore));

    const trend =
      recentAvg > olderAvg + 1
        ? 'improving'
        : recentAvg < olderAvg - 1
          ? 'declining'
          : 'stable';

    // Calculate average scores per dimension
    const avgScores = {
      technical: this.average(reports.map((r) => r.scores.technicalScore)),
      physical: this.average(reports.map((r) => r.scores.physicalScore)),
      psychological: this.average(
        reports.map((r) => r.scores.psychologicalScore),
      ),
      communication: this.average(
        reports.map((r) => r.scores.communicationScore),
      ),
      decisionMaking: this.average(
        reports.map((r) => r.scores.decisionMakingScore),
      ),
    };

    return {
      reports,
      summary: {
        totalReports: reports.length,
        averageScore:
          Math.round(this.average(reports.map((r) => r.overallScore)) * 10) /
          10,
        trend,
        trendValue: Math.round((recentAvg - olderAvg) * 10) / 10,
        averageScoresByDimension: avgScores,
        firstInspection: reports[reports.length - 1]?.inspectionDate,
        latestInspection: reports[0]?.inspectionDate,
      },
    };
  }

  async findLatestByReferee(refereeId: string) {
    const report = await this.inspectorReportModel
      .findOne({ refereeId: new Types.ObjectId(refereeId) })
      .populate({
        path: 'inspectorId',
        select: 'matricule region specialization',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('matchId', 'matchNumber homeTeam awayTeam date competition')
      .sort({ inspectionDate: -1 })
      .exec();

    if (!report) {
      throw new NotFoundException(
        `No inspector reports found for referee ${refereeId}`,
      );
    }

    return report;
  }

  async findOne(id: string) {
    const report = await this.inspectorReportModel
      .findById(id)
      .populate({
        path: 'inspectorId',
        select: 'matricule region specialization',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate({
        path: 'refereeId',
        select: 'matricule nom prenom category region',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('matchId', 'matchNumber homeTeam awayTeam date competition')
      .populate('reportedBy', 'firstName lastName email role')
      .populate('reviewedBy', 'firstName lastName role')
      .exec();

    if (!report) {
      throw new NotFoundException(`Le rapport d'inspection avec l'ID ${id} est introuvable`);
    }

    return report;
  }

  async update(id: string, dto: UpdateInspectorReportDto, userId: string) {
    const report = await this.inspectorReportModel.findById(id).exec();

    if (!report) {
      throw new NotFoundException(`Le rapport d'inspection avec l'ID ${id} est introuvable`);
    }

    // Only creator can edit DRAFT reports, Admin DNA can edit any
    if (
      report.status === InspectorReportStatus.DRAFT &&
      report.reportedBy.toString() !== userId
    ) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres rapports en brouillon');
    }

    // Recalculate overall score if scores changed
    if (dto.scores) {
      dto['overallScore'] = this.calculateOverallScore(dto.scores);
    }

    const updated = await this.inspectorReportModel
      .findByIdAndUpdate(
        id,
        { $set: { ...dto, updatedAt: new Date() } },
        { new: true },
      )
      .exec();

    return updated;
  }

  async submit(id: string, userId: string) {
    const report = await this.inspectorReportModel
      .findById(id)
      .populate({
        path: 'inspectorId',
        select: 'matricule region specialization',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate({
        path: 'refereeId',
        select: 'matricule nom prenom category region',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('matchId', 'matchNumber homeTeam awayTeam date')
      .exec();

    if (!report) {
      throw new NotFoundException(`Le rapport d'inspection avec l'ID ${id} est introuvable`);
    }

    if (report.reportedBy.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez soumettre que vos propres rapports');
    }

    report.status = InspectorReportStatus.SUBMITTED;
    report.updatedAt = new Date();
    const savedReport = await report.save();

    // Send notification to the referee about the inspector report
    this.notifyRefereeAboutReport(savedReport).catch((err) => {
      console.error('Error sending inspector report notification:', err);
    });

    return savedReport;
  }

  /**
   * Notify referee about a submitted inspector report
   */
  private async notifyRefereeAboutReport(
    report: InspectorReportDocument,
  ): Promise<void> {
    const refereeField = report.refereeId as any;
    const matchField = report.matchId as any;
    const inspectorField = report.inspectorId as any;

    if (!refereeField?.userId) return;

    const refereeUserId =
      refereeField.userId._id?.toString() || refereeField.userId.toString();
    const matchInfo = matchField
      ? `${matchField.homeTeam || ''} vs ${matchField.awayTeam || ''}`
      : 'Match';
    const inspectorName = inspectorField?.name || 'Inspecteur';
    const refereeName =
      `${refereeField.userId?.firstName || ''} ${refereeField.userId?.lastName || ''}`.trim() ||
      'Arbitre';

    // Notify the referee
    await this.notificationsService.notifyInspectorReport(refereeUserId, {
      matchInfo,
      inspectorName,
      reportId: report._id.toString(),
      matchId: matchField?._id?.toString(),
    });

    // Notify Admin DNA about the CDC report submission
    await this.notifyAdminDNAAboutReport(
      report,
      inspectorName,
      matchInfo,
      refereeName,
    );
  }

  /**
   * Notify Admin DNA when a CDC (Inspector) report is submitted
   * User Story: Admin DNA notifié dès qu'un rapport CDC est transmis
   */
  private async notifyAdminDNAAboutReport(
    report: InspectorReportDocument,
    inspectorName: string,
    matchInfo: string,
    refereeName: string,
  ): Promise<void> {
    try {
      // Find all Admin DNA users
      const admins = await this.userModel
        .find({
          role: 'ADMIN_DNA',
          isActive: true,
        })
        .exec();

      const matchField = report.matchId as any;

      for (const admin of admins) {
        await this.notificationsService.notifyInspectorReportToAdmin(
          admin._id.toString(),
          {
            inspectorName,
            matchInfo,
            refereeName,
            reportId: report._id.toString(),
            matchId: matchField?._id?.toString(),
          },
        );
      }
    } catch (error) {
      console.error('Error notifying Admin DNA about CDC report:', error);
    }
  }

  async review(id: string, userId: string) {
    const report = await this.inspectorReportModel.findById(id).exec();

    if (!report) {
      throw new NotFoundException(`Inspector report with ID ${id} not found`);
    }

    report.status = InspectorReportStatus.REVIEWED;
    report.reviewedBy = new Types.ObjectId(userId);
    report.updatedAt = new Date();
    return report.save();
  }

  async remove(id: string) {
    const report = await this.inspectorReportModel
      .findByIdAndUpdate(
        id,
        { $set: { status: InspectorReportStatus.ARCHIVED } },
        { new: true },
      )
      .exec();

    if (!report) {
      throw new NotFoundException(`Inspector report with ID ${id} not found`);
    }

    return { message: 'Report archived successfully' };
  }

  // Helper method for RefereeMatchingService integration
  async getRecentReportsForReferee(refereeId: string, limit: number = 5) {
    return this.inspectorReportModel
      .find({
        refereeId: new Types.ObjectId(refereeId),
        status: {
          $in: [
            InspectorReportStatus.SUBMITTED,
            InspectorReportStatus.REVIEWED,
          ],
        },
      })
      .sort({ inspectionDate: -1 })
      .limit(limit)
      .exec();
  }

  private calculateOverallScore(scores: any): number {
    // Weighted average: technical 25%, physical 20%, psychological 20%, communication 20%, decisionMaking 15%
    const overallScore =
      scores.technicalScore * 0.25 +
      scores.physicalScore * 0.2 +
      scores.psychologicalScore * 0.2 +
      scores.communicationScore * 0.2 +
      scores.decisionMakingScore * 0.15;

    return Math.round(overallScore * 10) / 10;
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}
