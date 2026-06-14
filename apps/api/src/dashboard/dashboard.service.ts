import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from '../matches/schemas/match.schema';
import {
  Designation,
  DesignationDocument,
} from '../designations/schemas/designation.schema';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import {
  Convocation,
  ConvocationDocument,
} from '../convocations/schemas/convocation.schema';
import {
  InspectorReport,
  InspectorReportDocument,
} from '../inspector-reports/schemas/inspector-report.schema';

export interface GlobalDashboardStats {
  overview: {
    totalMatches: number;
    matchesThisSeason: number;
    matchesThisMonth: number;
    matchesToday: number;
    upcomingMatches: number;
  };
  referees: {
    totalActive: number;
    byCategory: Record<string, number>;
    recentlyUpdated: number;
  };
  designations: {
    pending: number;
    validated: number;
    total: number;
    completionRate: number;
  };
  convocations: {
    upcoming: number;
    thisMonth: number;
  };
  inspectorReports: {
    pending: number;
    submitted: number;
    reviewed: number;
  };
  payments: {
    pendingValidation: number;
    validatedThisMonth: number;
    totalAmountThisMonth: number;
  };
  recentActivity: {
    latestMatches: any[];
    latestDesignations: any[];
    latestReports: any[];
  };
}

export interface DashboardFilters {
  saison?: string;
  month?: number;
  year?: number;
  journee?: number;
  region?: string;
  league?: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Match.name)
    private matchModel: Model<MatchDocument>,
    @InjectModel(Designation.name)
    private designationModel: Model<DesignationDocument>,
    @InjectModel(Referee.name)
    private refereeModel: Model<RefereeDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(Convocation.name)
    private convocationModel: Model<ConvocationDocument>,
    @InjectModel(InspectorReport.name)
    private inspectorReportModel: Model<InspectorReportDocument>,
  ) {}

  /**
   * Get global dashboard statistics
   * User Story: Page d'accueil avec stats globales (graphes, filtres journée/mois/saison)
   */
  async getGlobalStats(
    filters: DashboardFilters = {},
  ): Promise<GlobalDashboardStats> {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    // Calculate date ranges
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // Default saison (e.g., "2025-2026")
    const currentSaison = filters.saison || this.getCurrentSaison();

    // Build match filter based on filters
    const matchFilter: any = {};
    if (filters.saison) matchFilter.saison = filters.saison;
    if (filters.journee) matchFilter.journee = filters.journee;
    if (filters.region) matchFilter.region = filters.region;
    if (filters.league) matchFilter.league = filters.league;

    // Execute all queries in parallel for performance
    const [
      // Match stats
      totalMatches,
      matchesThisSeason,
      matchesThisMonth,
      matchesToday,
      upcomingMatches,
      latestMatches,

      // Referee stats
      totalActiveReferees,
      refereesByCategory,

      // Designation stats
      pendingDesignations,
      validatedDesignations,
      totalDesignations,
      latestDesignations,

      // Convocation stats
      upcomingConvocations,
      convocationsThisMonth,

      // Inspector reports stats
      pendingReports,
      submittedReports,
      reviewedReports,
      latestReports,

      // Payment stats
      pendingPayments,
      validatedPaymentsThisMonth,
    ] = await Promise.all([
      // Matches
      this.matchModel.countDocuments(matchFilter),
      this.matchModel.countDocuments({ ...matchFilter, saison: currentSaison }),
      this.matchModel.countDocuments({
        ...matchFilter,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      this.matchModel.countDocuments({
        ...matchFilter,
        date: { $gte: startOfToday, $lte: endOfToday },
      }),
      this.matchModel.countDocuments({
        ...matchFilter,
        date: { $gt: new Date() },
        status: { $ne: 'cancelled' },
      }),
      this.matchModel
        .find(matchFilter)
        .sort({ date: -1 })
        .limit(5)
        .select('homeTeam awayTeam date journee league status')
        .lean(),

      // Referees
      this.refereeModel.countDocuments({ isAvailable: true }),
      this.refereeModel.aggregate([
        { $match: { isAvailable: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Designations
      this.designationModel.countDocuments({ status: 'pending' }),
      this.designationModel.countDocuments({ status: 'validated' }),
      this.designationModel.countDocuments(),
      this.designationModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('matchId', 'homeTeam awayTeam date')
        .select('status createdAt matchId')
        .lean(),

      // Convocations
      this.convocationModel.countDocuments({
        date: { $gt: new Date() },
        status: { $ne: 'cancelled' },
      }),
      this.convocationModel.countDocuments({
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }),

      // Inspector Reports
      this.inspectorReportModel.countDocuments({ status: 'DRAFT' }),
      this.inspectorReportModel.countDocuments({ status: 'SUBMITTED' }),
      this.inspectorReportModel.countDocuments({ status: 'REVIEWED' }),
      this.inspectorReportModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('refereeId', 'matricule')
        .populate('matchId', 'homeTeam awayTeam date')
        .select('status overallScore createdAt')
        .lean(),

      // Payments
      this.paymentModel.countDocuments({ status: 'pending' }),
      this.paymentModel.aggregate([
        {
          $match: {
            status: 'validated',
            updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // Transform referees by category to object
    const refereeByCategoryObj: Record<string, number> = {};
    refereesByCategory.forEach((item: any) => {
      refereeByCategoryObj[item._id] = item.count;
    });

    // Calculate completion rate
    const completionRate =
      totalDesignations > 0
        ? Math.round((validatedDesignations / totalDesignations) * 100)
        : 0;

    return {
      overview: {
        totalMatches,
        matchesThisSeason,
        matchesThisMonth,
        matchesToday,
        upcomingMatches,
      },
      referees: {
        totalActive: totalActiveReferees,
        byCategory: refereeByCategoryObj,
        recentlyUpdated: 0, // Could be implemented if needed
      },
      designations: {
        pending: pendingDesignations,
        validated: validatedDesignations,
        total: totalDesignations,
        completionRate,
      },
      convocations: {
        upcoming: upcomingConvocations,
        thisMonth: convocationsThisMonth,
      },
      inspectorReports: {
        pending: pendingReports,
        submitted: submittedReports,
        reviewed: reviewedReports,
      },
      payments: {
        pendingValidation: pendingPayments,
        validatedThisMonth: validatedPaymentsThisMonth[0]?.count || 0,
        totalAmountThisMonth: validatedPaymentsThisMonth[0]?.totalAmount || 0,
      },
      recentActivity: {
        latestMatches,
        latestDesignations,
        latestReports,
      },
    };
  }

  /**
   * Get matches chart data grouped by journee or month
   */
  async getMatchesChartData(
    groupBy: 'journee' | 'month' = 'journee',
    filters: DashboardFilters = {},
  ): Promise<
    Array<{
      _id: number | { year: number; month: number };
      total: number;
      completed: number;
      upcoming?: number;
    }>
  > {
    const matchFilter: Record<string, unknown> = {};
    if (filters.saison) matchFilter.saison = filters.saison;
    if (filters.league) matchFilter.league = filters.league;

    type ChartResult = {
      _id: number | { year: number; month: number };
      total: number;
      completed: number;
      upcoming?: number;
    };

    if (groupBy === 'journee') {
      const result = await this.matchModel
        .aggregate<ChartResult>([
          { $match: matchFilter },
          {
            $group: {
              _id: '$journee',
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
              },
              upcoming: {
                $sum: {
                  $cond: [{ $in: ['$status', ['pending', 'scheduled']] }, 1, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .exec();

      return result;
    } else {
      const result = await this.matchModel
        .aggregate<ChartResult>([
          { $match: matchFilter },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
              },
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
              },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ])
        .exec();

      return result;
    }
  }

  /**
   * Get referee performance trends
   */
  async getRefereePerformanceTrends(filters: DashboardFilters = {}): Promise<
    Array<{
      _id: { year: number; month: number };
      averageScore: number;
      totalReports: number;
    }>
  > {
    type PerformanceResult = {
      _id: { year: number; month: number };
      averageScore: number;
      totalReports: number;
    };

    // Note: filters.saison could be used to filter by season if needed
    void filters;

    const result = await this.inspectorReportModel
      .aggregate<PerformanceResult>([
        { $match: { status: 'REVIEWED' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            averageScore: { $avg: '$overallScore' },
            totalReports: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ])
      .exec();

    return result;
  }

  /**
   * Get current season string (e.g., "2025-2026")
   */
  private getCurrentSaison(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Season starts in August
    if (month >= 7) {
      // August onwards
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }
}
