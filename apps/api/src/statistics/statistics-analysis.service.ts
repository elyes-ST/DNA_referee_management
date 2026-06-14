import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import {
  InspectorReport,
  InspectorReportDocument,
} from '../inspector-reports/schemas/inspector-report.schema';
import { RefereeCategory } from '../common/enums';
import { getAllowedCategoriesForRole } from '../common/helpers';

export interface RankingResult {
  refereeId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  category: string;
  matchesCount: number;
  averageNote: number;
  performanceScore: number;
  rank: number;
}

export interface PaginatedRanking {
  data: RankingResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SpeedChartData {
  dimensions: string[];
  currentScores: number[];
  avgScores: number[];
  minScores: number[];
  maxScores: number[];
  initialScores: number[];
}

export interface MyStatistics {
  refereeId: string;
  matricule: string;
  category: string;
  totalMatches: number;
  averageNote: number;
  bestNote: number;
  worstNote: number;
  recentMatches: number;
  recentAverageNote: number;
  ranking?: {
    position: number;
    totalInCategory: number;
  };
}

@Injectable()
export class StatisticsAnalysisService {
  constructor(
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    @InjectModel(InspectorReport.name)
    private inspectorReportModel: Model<InspectorReportDocument>,
  ) { }

  /**
   * Helper to get refereeId from userId
   */
  private async getRefereeByUserId(userId: string): Promise<RefereeDocument> {
    const referee = await this.refereeModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'firstName lastName')
      .exec();
    if (!referee) {
      throw new NotFoundException('Profil d\'arbitre introuvable pour cet utilisateur');
    }
    return referee;
  }

  /**
   * Get my own statistics (for ARBITRE role)
   */
  async getMyStatistics(userId: string): Promise<MyStatistics> {
    const referee = await this.getRefereeByUserId(userId);

    const reports = await this.inspectorReportModel
      .find({ refereeId: referee._id })
      .sort({ inspectionDate: -1 })
      .exec();

    const recentReports = reports.slice(0, 5);
    const notes = reports.map((r) => r.overallScore);

    const stats: MyStatistics = {
      refereeId: referee._id.toString(),
      matricule: referee.matricule,
      category: referee.category,
      totalMatches: reports.length,
      averageNote:
        notes.length > 0
          ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) /
          10
          : 0,
      bestNote: notes.length > 0 ? Math.max(...notes) : 0,
      worstNote: notes.length > 0 ? Math.min(...notes) : 0,
      recentMatches: recentReports.length,
      recentAverageNote:
        recentReports.length > 0
          ? Math.round(
            (recentReports.reduce((sum, r) => sum + r.overallScore, 0) /
              recentReports.length) *
            10,
          ) / 10
          : 0,
    };

    // Calculate ranking position
    const fullRanking = await this.calculateRanking(referee.category, 1, 9999);
    const myRanking = fullRanking.data.find(
      (r) => r.refereeId === referee._id.toString(),
    );
    if (myRanking) {
      stats.ranking = {
        position: myRanking.rank,
        totalInCategory: fullRanking.total,
      };
    }

    return stats;
  }

  /**
   * Get my speed chart data
   */
  async getMySpeedChart(userId: string): Promise<SpeedChartData> {
    const referee = await this.getRefereeByUserId(userId);
    return this.generateSpeedChartData(referee._id.toString());
  }

  /**
   * Get my progression over time
   */
  async getMyProgression(userId: string): Promise<any> {
    const referee = await this.getRefereeByUserId(userId);
    return this.trackProgression(referee._id.toString());
  }

  /**
   * Get my ranking in category
   */
  async getMyRanking(userId: string): Promise<{
    position: number;
    totalInCategory: number;
    category: string;
    performanceScore: number;
    averageNote: number;
  }> {
    const referee = await this.getRefereeByUserId(userId);
    const fullRanking = await this.calculateRanking(referee.category, 1, 9999);
    const myRanking = fullRanking.data.find(
      (r) => r.refereeId === referee._id.toString(),
    );

    if (!myRanking) {
      return {
        position: 0,
        totalInCategory: fullRanking.total,
        category: referee.category,
        performanceScore: 0,
        averageNote: 0,
      };
    }

    return {
      position: myRanking.rank,
      totalInCategory: fullRanking.total,
      category: referee.category,
      performanceScore: myRanking.performanceScore,
      averageNote: myRanking.averageNote,
    };
  }

  async calculateRanking(
    category: RefereeCategory,
    page = 1,
    limit = 20,
    userRole?: string,
  ): Promise<PaginatedRanking> {
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(category)) {
      throw new ForbiddenException(`Vous n'êtes pas autorisé à voir le classement pour la catégorie ${category}`);
    }

    // Get all referees in category
    const referees = await this.refereeModel
      .find({ category })
      .populate('userId', 'firstName lastName')
      .exec();

    const rankings: RankingResult[] = [];

    for (const referee of referees) {
      // Get all inspector reports for this referee
      const reports = await this.inspectorReportModel
        .find({ refereeId: referee._id })
        .sort({ inspectionDate: -1 })
        .exec();

      if (reports.length === 0) continue;

      const averageNote =
        reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length;

      // Performance score combines average note and number of matches
      const performanceScore =
        averageNote * 0.7 + Math.min(reports.length * 0.5, 30);

      rankings.push({
        refereeId: referee._id.toString(),
        matricule: referee.matricule,
        firstName: (referee.userId as any)?.firstName || '',
        lastName: (referee.userId as any)?.lastName || '',
        category: referee.category,
        matchesCount: reports.length,
        averageNote: Math.round(averageNote * 10) / 10,
        performanceScore: Math.round(performanceScore * 10) / 10,
        rank: 0,
      });
    }

    // Sort by performance score descending
    rankings.sort((a, b) => b.performanceScore - a.performanceScore);

    // Assign absolute ranks (1-based, across all pages)
    rankings.forEach((r, index) => {
      r.rank = index + 1;
    });

    const total = rankings.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const data = rankings.slice(skip, skip + limit);

    return { data, total, page, limit, totalPages };
  }

  async generateSpeedChartData(refereeId: string, userRole?: string): Promise<SpeedChartData> {
    const referee = await this.refereeModel.findById(refereeId).exec();
    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder aux statistiques de cet arbitre");
    }

    const reports = await this.inspectorReportModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .sort({ inspectionDate: -1 })
      .exec();

    if (reports.length === 0) {
      throw new NotFoundException('No reports found for this referee');
    }

    const dimensions = [
      'Technical',
      'Physical',
      'Psychological',
      'Communication',
      'Decision Making',
    ];

    // Calculate current scores (average of last 3 reports)
    const recentReports = reports.slice(0, Math.min(3, reports.length));
    const currentScores = [
      this.average(recentReports.map((r) => r.scores.technicalScore)),
      this.average(recentReports.map((r) => r.scores.physicalScore)),
      this.average(recentReports.map((r) => r.scores.psychologicalScore)),
      this.average(recentReports.map((r) => r.scores.communicationScore)),
      this.average(recentReports.map((r) => r.scores.decisionMakingScore)),
    ];

    // Calculate category averages (need all referees in same category)
    const allReportsInCategory = await this.inspectorReportModel.aggregate([
      {
        $lookup: {
          from: 'referees',
          localField: 'refereeId',
          foreignField: '_id',
          as: 'referee',
        },
      },
      { $unwind: '$referee' },
      { $match: { 'referee.category': referee.category } },
    ]);

    const avgScores = [
      this.average(
        allReportsInCategory.map((r) => r.scores?.technicalScore || 0),
      ),
      this.average(
        allReportsInCategory.map((r) => r.scores?.physicalScore || 0),
      ),
      this.average(
        allReportsInCategory.map((r) => r.scores?.psychologicalScore || 0),
      ),
      this.average(
        allReportsInCategory.map((r) => r.scores?.communicationScore || 0),
      ),
      this.average(
        allReportsInCategory.map((r) => r.scores?.decisionMakingScore || 0),
      ),
    ];

    // Min and max scores in category
    const minScores = [
      Math.min(
        ...allReportsInCategory.map((r) => r.scores?.technicalScore || 0),
      ),
      Math.min(
        ...allReportsInCategory.map((r) => r.scores?.physicalScore || 0),
      ),
      Math.min(
        ...allReportsInCategory.map((r) => r.scores?.psychologicalScore || 0),
      ),
      Math.min(
        ...allReportsInCategory.map((r) => r.scores?.communicationScore || 0),
      ),
      Math.min(
        ...allReportsInCategory.map((r) => r.scores?.decisionMakingScore || 0),
      ),
    ];

    const maxScores = [
      Math.max(
        ...allReportsInCategory.map((r) => r.scores?.technicalScore || 0),
      ),
      Math.max(
        ...allReportsInCategory.map((r) => r.scores?.physicalScore || 0),
      ),
      Math.max(
        ...allReportsInCategory.map((r) => r.scores?.psychologicalScore || 0),
      ),
      Math.max(
        ...allReportsInCategory.map((r) => r.scores?.communicationScore || 0),
      ),
      Math.max(
        ...allReportsInCategory.map((r) => r.scores?.decisionMakingScore || 0),
      ),
    ];

    // Initial scores (first evaluation)
    const initialReport = reports[reports.length - 1];
    const initialScores = [
      initialReport.scores.technicalScore,
      initialReport.scores.physicalScore,
      initialReport.scores.psychologicalScore,
      initialReport.scores.communicationScore,
      initialReport.scores.decisionMakingScore,
    ];

    return {
      dimensions,
      currentScores: currentScores.map((s) => Math.round(s * 10) / 10),
      avgScores: avgScores.map((s) => Math.round(s * 10) / 10),
      minScores,
      maxScores,
      initialScores,
    };
  }

  async compareWithPeers(refereeId: string, userRole?: string) {
    const referee = await this.refereeModel.findById(refereeId).exec();
    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder aux statistiques de cet arbitre");
    }

    const refereeReports = await this.inspectorReportModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .sort({ inspectionDate: -1 })
      .exec();

    if (refereeReports.length === 0) {
      throw new NotFoundException('No reports found for this referee');
    }

    // Get all reports for category
    const categoryReports = await this.inspectorReportModel.aggregate([
      {
        $lookup: {
          from: 'referees',
          localField: 'refereeId',
          foreignField: '_id',
          as: 'referee',
        },
      },
      { $unwind: '$referee' },
      { $match: { 'referee.category': referee.category } },
    ]);

    const refereeAvg = this.average(refereeReports.map((r) => r.overallScore));
    const categoryAvg = this.average(
      categoryReports.map((r) => r.overallScore),
    );
    const categoryMin = Math.min(...categoryReports.map((r) => r.overallScore));
    const categoryMax = Math.max(...categoryReports.map((r) => r.overallScore));

    // Trend analysis (compare last 3 vs first 3)
    const recentAvg = this.average(
      refereeReports
        .slice(0, Math.min(3, refereeReports.length))
        .map((r) => r.overallScore),
    );
    const initialAvg = this.average(
      refereeReports
        .slice(Math.max(0, refereeReports.length - 3))
        .map((r) => r.overallScore),
    );
    const trend =
      recentAvg > initialAvg + 1
        ? 'improving'
        : recentAvg < initialAvg - 1
          ? 'declining'
          : 'stable';

    return {
      referee: {
        id: refereeId,
        matricule: referee.matricule,
        averageNote: Math.round(refereeAvg * 10) / 10,
        matchesCount: refereeReports.length,
        trend,
        trendValue: Math.round((recentAvg - initialAvg) * 10) / 10,
      },
      category: {
        name: referee.category,
        averageNote: Math.round(categoryAvg * 10) / 10,
        minNote: categoryMin,
        maxNote: categoryMax,
      },
      comparison: {
        vsAverage: Math.round((refereeAvg - categoryAvg) * 10) / 10,
        percentile: this.calculatePercentile(
          refereeAvg,
          categoryReports.map((r) => r.overallScore),
        ),
      },
      initialState: {
        averageNote: Math.round(initialAvg * 10) / 10,
        firstReportDate:
          refereeReports[refereeReports.length - 1]?.inspectionDate,
      },
    };
  }

  async trackProgression(refereeId: string, userRole?: string) {
    const referee = await this.refereeModel.findById(refereeId).exec();
    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder aux statistiques de cet arbitre");
    }

    const reports = await this.inspectorReportModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .sort({ inspectionDate: 1 })
      .exec();

    if (reports.length === 0) {
      throw new NotFoundException('No reports found for this referee');
    }

    return {
      timeline: reports.map((r) => ({
        date: r.inspectionDate,
        overallScore: r.overallScore,
        matchId: r.matchId,
        technicalScore: r.scores.technicalScore,
        physicalScore: r.scores.physicalScore,
        psychologicalScore: r.scores.psychologicalScore,
        communicationScore: r.scores.communicationScore,
        decisionMakingScore: r.scores.decisionMakingScore,
      })),
      summary: {
        totalEvaluations: reports.length,
        firstEvaluation: reports[0].inspectionDate,
        latestEvaluation: reports[reports.length - 1].inspectionDate,
        initialNote: reports[0].overallScore,
        currentNote: reports[reports.length - 1].overallScore,
        progression:
          Math.round(
            (reports[reports.length - 1].overallScore -
              reports[0].overallScore) *
            10,
          ) / 10,
        averageNote:
          Math.round(this.average(reports.map((r) => r.overallScore)) * 10) /
          10,
      },
    };
  }

  async getSeminarNotes(refereeId: string, userRole?: string) {
    const referee = await this.refereeModel.findById(refereeId).exec();
    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder aux notes de séminaire de cet arbitre");
    }

    if (!referee.seminarNotes || referee.seminarNotes.length === 0) {
      return {
        seminars: [],
        summary: {
          totalSeminars: 0,
          averageNote: 0,
          progression: 0,
        },
      };
    }

    const seminars = referee.seminarNotes.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const avgNote = this.average(seminars.map((s) => s.note));
    const initialNote = seminars[0]?.note || 0;
    const currentNote = seminars[seminars.length - 1]?.note || 0;

    return {
      seminars,
      summary: {
        totalSeminars: seminars.length,
        averageNote: Math.round(avgNote * 10) / 10,
        firstSeminar: seminars[0]?.date,
        latestSeminar: seminars[seminars.length - 1]?.date,
        progression: Math.round((currentNote - initialNote) * 10) / 10,
      },
    };
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private calculatePercentile(value: number, dataset: number[]): number {
    const sorted = dataset.sort((a, b) => a - b);
    const below = sorted.filter((v) => v < value).length;
    return Math.round((below / sorted.length) * 100);
  }
}
