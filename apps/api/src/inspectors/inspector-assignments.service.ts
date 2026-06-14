import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InspectorAssignment,
  InspectorAssignmentDocument,
  AssignmentStatus,
} from './schemas/inspector-assignment.schema';
import { Inspector, InspectorDocument } from './schemas/inspector.schema';
import { Match, MatchDocument } from '../matches/schemas/match.schema';
import {
  CreateInspectorAssignmentDto,
  UpdateInspectorAssignmentDto,
  CancelAssignmentDto,
  FilterAssignmentsDto,
} from './dto';

@Injectable()
export class InspectorAssignmentsService {
  private readonly logger = new Logger(InspectorAssignmentsService.name);

  constructor(
    @InjectModel(InspectorAssignment.name)
    private assignmentModel: Model<InspectorAssignmentDocument>,
    @InjectModel(Inspector.name)
    private inspectorModel: Model<InspectorDocument>,
    @InjectModel(Match.name)
    private matchModel: Model<MatchDocument>,
  ) {}

  /**
   * Assign an inspector to a match (CDC action)
   */
  async create(
    createDto: CreateInspectorAssignmentDto,
    assignedBy: string,
  ): Promise<InspectorAssignment> {
    // Check if match exists
    const match = await this.matchModel.findById(createDto.matchId);
    if (!match) {
      throw new NotFoundException(
        `Match avec ID ${createDto.matchId} non trouvé`,
      );
    }

    // Check if inspector exists
    const inspector = await this.inspectorModel.findById(createDto.inspectorId);
    if (!inspector) {
      throw new NotFoundException(
        `Inspecteur avec ID ${createDto.inspectorId} non trouvé`,
      );
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentModel.findOne({
      matchId: new Types.ObjectId(createDto.matchId),
      inspectorId: new Types.ObjectId(createDto.inspectorId),
    });
    if (existingAssignment) {
      throw new ConflictException('Cet inspecteur est déjà affecté à ce match');
    }

    // Create assignment
    const assignment = await this.assignmentModel.create({
      matchId: new Types.ObjectId(createDto.matchId),
      inspectorId: new Types.ObjectId(createDto.inspectorId),
      status: AssignmentStatus.CONFIRMED, // CDC confirme directement
      assignedBy: new Types.ObjectId(assignedBy),
      assignedAt: new Date(),
      notes: createDto.notes,
    });

    return this.findById(assignment._id.toString());
  }

  /**
   * Get all assignments with filters
   */
  async findAll(
    filterDto?: FilterAssignmentsDto,
  ): Promise<InspectorAssignment[]> {
    const query: any = {};

    if (filterDto) {
      if (filterDto.matchId) {
        query.matchId = new Types.ObjectId(filterDto.matchId);
      }
      if (filterDto.inspectorId) {
        query.inspectorId = new Types.ObjectId(filterDto.inspectorId);
      }
      if (filterDto.status) {
        query.status = filterDto.status;
      }
    }

    return this.assignmentModel
      .find(query)
      .populate('matchId')
      .populate({
        path: 'inspectorId',
        populate: { path: 'userId', select: '-password' },
      })
      .populate('assignedBy', '-password')
      .populate('reportId')
      .sort({ assignedAt: -1 })
      .exec();
  }

  /**
   * Get assignment by ID
   */
  async findById(id: string): Promise<InspectorAssignment> {
    const assignment = await this.assignmentModel
      .findById(id)
      .populate('matchId')
      .populate({
        path: 'inspectorId',
        populate: { path: 'userId', select: '-password' },
      })
      .populate('assignedBy', '-password')
      .populate('reportId')
      .exec();

    if (!assignment) {
      throw new NotFoundException(`Affectation avec ID ${id} non trouvée`);
    }

    return assignment;
  }

  /**
   * Get assignments for a specific inspector
   */
  async findByInspector(
    inspectorId: string,
    status?: AssignmentStatus,
  ): Promise<InspectorAssignment[]> {
    const query: any = {
      inspectorId: new Types.ObjectId(inspectorId),
    };
    if (status) {
      query.status = status;
    }

    return this.assignmentModel
      .find(query)
      .populate('matchId')
      .sort({ assignedAt: -1 })
      .exec();
  }

  /**
   * Get assignments for a specific match
   */
  async findByMatch(matchId: string): Promise<InspectorAssignment[]> {
    return this.assignmentModel
      .find({ matchId: new Types.ObjectId(matchId) })
      .populate({
        path: 'inspectorId',
        populate: { path: 'userId', select: '-password' },
      })
      .populate('reportId')
      .exec();
  }

  /**
   * Get assignments awaiting report submission
   */
  async findAwaitingReport(): Promise<InspectorAssignment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignments = await this.assignmentModel
      .find({
        status: AssignmentStatus.CONFIRMED,
        reportId: { $exists: false },
      })
      .populate('matchId')
      .populate({
        path: 'inspectorId',
        populate: { path: 'userId', select: '-password' },
      })
      .exec();

    // Filter to only include past matches
    return assignments.filter((a) => {
      const match = a.matchId as any;
      return match && new Date(match.date) < today;
    });
  }

  /**
   * Update assignment
   */
  async update(
    id: string,
    updateDto: UpdateInspectorAssignmentDto,
  ): Promise<InspectorAssignment> {
    const assignment = await this.assignmentModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );

    if (!assignment) {
      throw new NotFoundException(`Affectation avec ID ${id} non trouvée`);
    }

    return this.findById(id);
  }

  /**
   * Cancel assignment (CDC action)
   */
  async cancel(
    id: string,
    userId: string,
    cancelDto: CancelAssignmentDto,
  ): Promise<InspectorAssignment> {
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException(`Affectation avec ID ${id} non trouvée`);
    }

    if (assignment.status === AssignmentStatus.COMPLETED) {
      throw new BadRequestException(
        "Impossible d'annuler une affectation terminée",
      );
    }

    assignment.status = AssignmentStatus.CANCELLED;
    assignment.cancellationReason = cancelDto.reason;
    assignment.cancelledBy = new Types.ObjectId(userId);

    await assignment.save();
    return this.findById(id);
  }

  /**
   * Link report to assignment and mark as completed
   */
  async linkReport(
    assignmentId: string,
    reportId: string,
  ): Promise<InspectorAssignment> {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException(
        `Affectation avec ID ${assignmentId} non trouvée`,
      );
    }

    assignment.status = AssignmentStatus.COMPLETED;
    assignment.reportId = new Types.ObjectId(reportId);

    await assignment.save();
    return this.findById(assignmentId);
  }

  /**
   * Get dashboard statistics for CDC
   */
  async getDashboardStats(): Promise<any> {
    const confirmed = await this.assignmentModel.countDocuments({
      status: AssignmentStatus.CONFIRMED,
    });
    const completed = await this.assignmentModel.countDocuments({
      status: AssignmentStatus.COMPLETED,
    });
    const cancelled = await this.assignmentModel.countDocuments({
      status: AssignmentStatus.CANCELLED,
    });

    const awaitingReport = await this.findAwaitingReport();

    // Recent assignments
    const recentAssignments = await this.assignmentModel
      .find()
      .populate('matchId', 'matchNumber homeTeam awayTeam date')
      .populate({
        path: 'inspectorId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ assignedAt: -1 })
      .limit(10)
      .exec();

    // Assignments by inspector
    const byInspector = await this.assignmentModel.aggregate([
      { $match: { status: { $ne: AssignmentStatus.CANCELLED } } },
      { $group: { _id: '$inspectorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return {
      summary: {
        confirmed,
        completed,
        cancelled,
        awaitingReport: awaitingReport.length,
        total: confirmed + completed + cancelled,
      },
      awaitingReportDetails: awaitingReport,
      recentAssignments,
      byInspector,
    };
  }
}
