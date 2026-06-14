import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Designation,
  DesignationDocument,
} from '../schemas/designation.schema';
import { Match, MatchDocument } from '../../matches/schemas/match.schema';
import {
  Referee,
  RefereeDocument,
} from '../../referees/schemas/referee.schema';
import { RefereeMatchingService } from './referee-matching.service';
import {
  DesignationStatus,
  RefereeRole,
  RefereeDesignationStatus,
} from '../../common/enums';

interface OverrideRefereeDto {
  refereeId: string;
  role: RefereeRole;
}

@Injectable()
export class DesignationOverrideService {
  constructor(
    @InjectModel(Designation.name)
    private designationModel: Model<DesignationDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    private readonly refereeMatchingService: RefereeMatchingService,
  ) { }

  /**
   * Override system-proposed designation with manual selection
   * EPIC 17: Override system, manual intervention
   */
  async overrideDesignation(
    designationId: string,
    newReferees: OverrideRefereeDto[],
    reason: string,
    userId: string,
  ): Promise<DesignationDocument> {
    const designation = await this.designationModel.findById(designationId);
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    // Only allow override for SUBMITTED or DRAFT status
    if (
      ![DesignationStatus.DRAFT, DesignationStatus.SUBMITTED].includes(
        designation.status,
      )
    ) {
      throw new BadRequestException(
        'Can only override DRAFT or SUBMITTED designations',
      );
    }

    // Validate all new referees exist
    const refereeIds = newReferees.map((r) => new Types.ObjectId(r.refereeId));
    const validReferees = await this.refereeModel.find({
      _id: { $in: refereeIds },
    });
    if (validReferees.length !== newReferees.length) {
      throw new BadRequestException('Un ou plusieurs arbitres introuvables');
    }

    // Store previous state
    const previousReferees = JSON.stringify(designation.referees);
    const newRefereesJson = JSON.stringify(newReferees);

    // Update designation with new referees
    const updatedReferees = newReferees.map((ref) => ({
      refereeId: new Types.ObjectId(ref.refereeId),
      role: ref.role,
      status: RefereeDesignationStatus.PROPOSED,
      proposedBy: new Types.ObjectId(userId),
      proposedAt: new Date(),
    })) as any;

    designation.referees = updatedReferees;
    designation.overrideHistory.push({
      overriddenBy: new Types.ObjectId(userId),
      reason,
      previousReferees,
      newReferees: newRefereesJson,
      overriddenAt: new Date(),
      isSystemOverride: false,
    });

    await designation.save();
    return designation;
  }

  /**
   * CRA President takes full control of designation
   * EPIC 17: President can take full control
   */
  async takeControl(
    designationId: string,
    userId: string,
    reason: string,
  ): Promise<DesignationDocument> {
    const designation = await this.designationModel.findById(designationId);
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    // Store the takeover in override history
    const previousState = JSON.stringify({
      designatedBy: designation.designatedBy,
      status: designation.status,
    });

    designation.designatedBy = new Types.ObjectId(userId);
    designation.status = DesignationStatus.DRAFT;
    designation.overrideHistory.push({
      overriddenBy: new Types.ObjectId(userId),
      reason: `TAKEOVER: ${reason}`,
      previousReferees: previousState,
      newReferees: 'Control transferred',
      overriddenAt: new Date(),
      isSystemOverride: false,
    });

    await designation.save();
    return designation;
  }

  /**
   * Get override history for a designation
   * EPIC 17: Complete audit trail
   */
  async getOverrideHistory(designationId: string): Promise<any[]> {
    const designation = await this.designationModel
      .findById(designationId)
      .populate('overrideHistory.overriddenBy', 'firstName lastName email role')
      .exec();

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    return designation.overrideHistory.map((entry) => ({
      overriddenBy: entry.overriddenBy,
      reason: entry.reason,
      previousReferees: this.safeParseJson(entry.previousReferees),
      newReferees: this.safeParseJson(entry.newReferees),
      overriddenAt: entry.overriddenAt,
      isSystemOverride: entry.isSystemOverride,
    }));
  }

  /**
   * Get all overrides across system (for audit/reporting)
   */
  async getAllOverrides(filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<any[]> {
    const query: any = { 'overrideHistory.0': { $exists: true } };

    const designations = await this.designationModel
      .find(query)
      .populate('matchId', 'homeTeam awayTeam matchDate competition')
      .populate('overrideHistory.overriddenBy', 'firstName lastName email role')
      .exec();

    let allOverrides: any[] = [];
    designations.forEach((designation) => {
      designation.overrideHistory.forEach((entry) => {
        allOverrides.push({
          designationId: designation._id,
          match: designation.matchId,
          overriddenBy: entry.overriddenBy,
          reason: entry.reason,
          previousReferees: this.safeParseJson(entry.previousReferees),
          newReferees: this.safeParseJson(entry.newReferees),
          overriddenAt: entry.overriddenAt,
          isSystemOverride: entry.isSystemOverride,
        });
      });
    });

    // Apply filters
    if (filters?.startDate) {
      allOverrides = allOverrides.filter(
        (o) => o.overriddenAt && new Date(o.overriddenAt) >= filters.startDate!,
      );
    }
    if (filters?.endDate) {
      allOverrides = allOverrides.filter(
        (o) => o.overriddenAt && new Date(o.overriddenAt) <= filters.endDate!,
      );
    }
    if (filters?.userId) {
      allOverrides = allOverrides.filter(
        (o) => o.overriddenBy?._id?.toString() === filters.userId,
      );
    }

    return allOverrides.sort(
      (a, b) =>
        new Date(b.overriddenAt).getTime() - new Date(a.overriddenAt).getTime(),
    );
  }

  /**
   * Revert to previous designation (undo override)
   * EPIC 17: Ability to revert changes
   */
  async revertOverride(
    designationId: string,
    userId: string,
    reason: string,
  ): Promise<DesignationDocument> {
    const designation = await this.designationModel.findById(designationId);
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    if (
      !designation.overrideHistory ||
      designation.overrideHistory.length === 0
    ) {
      throw new BadRequestException('No override history to revert');
    }

    // Get the last override
    const lastOverride =
      designation.overrideHistory[designation.overrideHistory.length - 1];
    const previousReferees = this.safeParseJson(lastOverride.previousReferees);

    // Store current state before reverting
    const currentReferees = JSON.stringify(designation.referees);

    // Revert to previous state
    if (Array.isArray(previousReferees)) {
      designation.referees = previousReferees.map((ref) => ({
        ...ref,
        refereeId: new Types.ObjectId(ref.refereeId),
        proposedBy: ref.proposedBy
          ? new Types.ObjectId(ref.proposedBy)
          : undefined,
      }));
    }

    // Add revert action to history
    designation.overrideHistory.push({
      overriddenBy: new Types.ObjectId(userId),
      reason: `REVERT: ${reason}`,
      previousReferees: currentReferees,
      newReferees: lastOverride.previousReferees,
      overriddenAt: new Date(),
      isSystemOverride: false,
    });

    await designation.save();
    return designation;
  }

  /**
   * Safe JSON parse helper
   */
  private safeParseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  }
}
