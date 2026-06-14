import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Referee,
  RefereeDocument,
} from '../../referees/schemas/referee.schema';
import { Match, MatchDocument } from '../../matches/schemas/match.schema';
import {
  InspectorReport,
  InspectorReportDocument,
} from '../../inspector-reports/schemas/inspector-report.schema';
import {
  Designation,
  DesignationDocument,
} from '../schemas/designation.schema';
import { DesignationValidationService } from './designation-validation.service';
import { RefereeRole, InspectorVerdict } from '../../common/enums';

export interface RefereeSuggestion {
  refereeId: string;
  name: string;
  score: number;
  reasons: string[];
}

@Injectable()
export class RefereeMatchingService {
  constructor(
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(InspectorReport.name)
    private inspectorReportModel: Model<InspectorReportDocument>,
    @InjectModel(Designation.name)
    private designationModel: Model<DesignationDocument>,
    private validationService: DesignationValidationService,
  ) {}

  async calculateRefereeScore(
    refereeId: string,
    matchId: string,
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    const match = await this.matchModel.findById(matchId);
    const referee = await this.refereeModel.findById(refereeId);

    if (!match || !referee) {
      return { score: 0, reasons: ['Invalid referee or match'] };
    }

    const matchData = match.toObject() as any;
    const refereeData = referee.toObject() as any;

    // Get inspector reports for performance scoring
    const inspectorReports = await this.inspectorReportModel
      .find({
        refereeId: new Types.ObjectId(refereeId),
        status: { $in: ['SUBMITTED', 'REVIEWED'] },
      })
      .sort({ inspectionDate: -1 })
      .limit(5)
      .exec();

    let performanceScore = 0;

    // Inspector reports scoring (100% weight - single source of truth)
    if (inspectorReports.length > 0) {
      const latestInspectorReport = inspectorReports[0];
      const avgInspectorScore =
        inspectorReports.reduce((sum, r) => sum + r.overallScore, 0) /
        inspectorReports.length;
      performanceScore = (avgInspectorScore / 20) * 30;
      reasons.push(
        `Inspector Reports: ${avgInspectorScore.toFixed(1)}/20 (+${performanceScore.toFixed(1)})`,
      );

      // Apply penalty for INSUFFICIENT verdict
      if (latestInspectorReport.verdict === InspectorVerdict.INSUFFICIENT) {
        performanceScore -= 30;
        reasons.push('INSUFFICIENT verdict (-30)');
      }
    }

    score += performanceScore;

    const startOfMonth = new Date(match.date);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const monthMatches = await this.matchModel
      .find({
        date: { $gte: startOfMonth, $lt: endOfMonth },
      })
      .select('_id')
      .exec();

    const matchIds = monthMatches.map((m: any) => m._id as Types.ObjectId);
    const monthlyWorkload = await this.designationModel.countDocuments({
      matchId: { $in: matchIds },
      'referees.refereeId': new Types.ObjectId(refereeId),
    });

    const workloadScore = Math.max(0, 20 - monthlyWorkload * 2);
    score += workloadScore;
    reasons.push(`Workload: ${monthlyWorkload} matches (+${workloadScore})`);

    const isAvailable = await this.validationService.checkAvailability(
      refereeId,
      match.date,
    );
    if (isAvailable) {
      score += 20;
      reasons.push('Available (+20)');
    } else {
      score -= 100;
      reasons.push('UNAVAILABLE (-100)');
    }

    const hasConflict = await this.validationService.checkDoubleBooking(
      refereeId,
      match.date,
    );
    if (hasConflict) {
      score -= 100;
      reasons.push('DOUBLE BOOKING (-100)');
    } else {
      score += 15;
      reasons.push('No conflicts (+15)');
    }

    const isEligible = await this.validationService.checkCategoryEligibility(
      refereeId,
      match.category || '',
    );
    if (isEligible) {
      score += 15;
      reasons.push('Category eligible (+15)');
    } else {
      score -= 50;
      reasons.push('Category mismatch (-50)');
    }

    if (refereeData.region === matchData.region) {
      score += 10;
      reasons.push('Same region (+10)');
    }

    return { score, reasons };
  }

  async suggestReferees(
    matchId: string,
    role: RefereeRole,
    count: number = 5,
  ): Promise<RefereeSuggestion[]> {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      return [];
    }

    const referees = await this.refereeModel
      .find({ isActive: true })
      .select('_id nom prenom category region')
      .exec();

    const suggestions: RefereeSuggestion[] = [];

    for (const referee of referees) {
      const { score, reasons } = await this.calculateRefereeScore(
        referee._id.toString(),
        matchId,
      );

      const refereeData = referee.toObject() as any;
      suggestions.push({
        refereeId: referee._id.toString(),
        name: `${refereeData.nom} ${refereeData.prenom}`,
        score,
        reasons,
      });
    }

    suggestions.sort((a, b) => b.score - a.score);

    return suggestions.slice(0, count);
  }

  async optimizeBatch(
    matches: string[],
    _availableRefereeIds: string[],
  ): Promise<
    Record<
      string,
      {
        arbitreCentral: string[];
        assistant1: string[];
        assistant2: string[];
        quatriemeArbitre: string[];
        arbitreVar?: string[];
        assistantVar?: string[];
      }
    >
  > {
    const assignments: Record<
      string,
      {
        arbitreCentral: string[];
        assistant1: string[];
        assistant2: string[];
        quatriemeArbitre: string[];
        arbitreVar?: string[];
        assistantVar?: string[];
      }
    > = {};

    for (const matchId of matches) {
      const centralSuggestions = await this.suggestReferees(
        matchId,
        RefereeRole.ARBITRE_CENTRAL,
        2,
      );
      const assistant1Suggestions = await this.suggestReferees(
        matchId,
        RefereeRole.ASSISTANT_1,
        2,
      );
      const assistant2Suggestions = await this.suggestReferees(
        matchId,
        RefereeRole.ASSISTANT_2,
        2,
      );
      const quatrieme = await this.suggestReferees(
        matchId,
        RefereeRole.QUATRIEME_ARBITRE,
        2,
      );

      assignments[matchId] = {
        arbitreCentral: centralSuggestions.map((s) => s.refereeId),
        assistant1: assistant1Suggestions.map((s) => s.refereeId),
        assistant2: assistant2Suggestions.map((s) => s.refereeId),
        quatriemeArbitre: quatrieme.map((s) => s.refereeId),
      };
    }

    return assignments;
  }
}
