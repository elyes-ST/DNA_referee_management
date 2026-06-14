import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Designation,
  DesignationDocument,
} from '../schemas/designation.schema';
import {
  Availability,
  AvailabilityDocumentType,
} from '../schemas/availability.schema';
import { Match, MatchDocument } from '../../matches/schemas/match.schema';
import {
  Referee,
  RefereeDocument,
} from '../../referees/schemas/referee.schema';
import { Team, TeamDocument } from '../../teams/schemas/team.schema';
import {
  Role,
  RefereeCategory,
  AvailabilityStatus,
  RefereeRole,
} from '../../common/enums';

@Injectable()
export class DesignationValidationService {
  constructor(
    @InjectModel(Designation.name)
    private designationModel: Model<DesignationDocument>,
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocumentType>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
  ) { }

  async checkAvailability(refereeId: string, date: Date): Promise<boolean> {
    const unavailability = await this.availabilityModel.findOne({
      refereeId: new Types.ObjectId(refereeId),
      dateFrom: { $lte: date },
      dateTo: { $gte: date },
      status: AvailabilityStatus.APPROVED,
    });

    return !unavailability;
  }

  async checkCategoryEligibility(
    refereeId: string,
    matchCategory: string,
  ): Promise<boolean> {
    const referee = await this.refereeModel.findById(refereeId);
    if (!referee) return false;

    const categoryHierarchy = {
      [RefereeCategory.A]: [
        RefereeCategory.A,
        RefereeCategory.B,
        RefereeCategory.C1,
        RefereeCategory.C2,
        RefereeCategory.JEUNE,
        RefereeCategory.FEMININE,
        RefereeCategory.REGIONAL,
      ],
      [RefereeCategory.B]: [
        RefereeCategory.B,
        RefereeCategory.C1,
        RefereeCategory.C2,
        RefereeCategory.JEUNE,
        RefereeCategory.FEMININE,
        RefereeCategory.REGIONAL,
      ],
      [RefereeCategory.C1]: [
        RefereeCategory.C1,
        RefereeCategory.C2,
        RefereeCategory.JEUNE,
        RefereeCategory.FEMININE,
        RefereeCategory.REGIONAL,
      ],
      [RefereeCategory.C2]: [
        RefereeCategory.C2,
        RefereeCategory.JEUNE,
        RefereeCategory.FEMININE,
        RefereeCategory.REGIONAL,
      ],
      [RefereeCategory.JEUNE]: [RefereeCategory.JEUNE],
      [RefereeCategory.FEMININE]: [RefereeCategory.FEMININE],
      [RefereeCategory.REGIONAL]: [RefereeCategory.REGIONAL],
    };

    const allowedCategories = categoryHierarchy[referee.category] || [];
    return allowedCategories.includes(matchCategory as RefereeCategory) as boolean;
  }

  async checkWorkloadLimit(
    refereeId: string,
    period: { start: Date; end: Date },
  ): Promise<boolean> {
    const matches = await this.matchModel
      .find({
        date: { $gte: period.start, $lte: period.end },
      })
      .select('_id')
      .exec();

    const matchIds = matches.map((m: any) => m._id as Types.ObjectId);

    const designations = await this.designationModel
      .find({
        matchId: { $in: matchIds },
        'referees.refereeId': new Types.ObjectId(refereeId),
        status: { $in: ['VALIDATED', 'COMPLETED'] },
      })
      .countDocuments();

    const MAX_MATCHES_PER_MONTH = 10;
    return designations < MAX_MATCHES_PER_MONTH;
  }

  async validateDesignationRules(
    designation: any,
    matchId: string,
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const match = await this.matchModel.findById(matchId);

    if (!match) {
      errors.push('Match non trouvé');
      return { valid: false, errors, warnings };
    }

    // Récupérer les informations des équipes
    let homeTeamRegion: string | null = null;
    let awayTeamRegion: string | null = null;

    if (match.homeTeamId) {
      const homeTeam = await this.teamModel.findById(match.homeTeamId);
      if (homeTeam) homeTeamRegion = homeTeam.region;
    }
    if (match.awayTeamId) {
      const awayTeam = await this.teamModel.findById(match.awayTeamId);
      if (awayTeam) awayTeamRegion = awayTeam.region;
    }

    for (const ref of designation.referees) {
      const referee = await this.refereeModel.findById(ref.refereeId);
      if (!referee) {
        errors.push(`Arbitre ${ref.refereeId} non trouvé`);
        continue;
      }

      const refereeName = referee.matricule;

      // 1. Vérification du conflit de journée (un seul match par journée)
      const hasJourneeConflict = await this.checkJourneeConflict(
        ref.refereeId,
        match.journee,
        match.saison,
        match.competition,
        matchId,
      );
      if (hasJourneeConflict) {
        errors.push(
          `L'arbitre ${refereeName} a déjà un match à la journée ${match.journee}`,
        );
      }

      // 2. Vérification du double booking le même jour
      const hasDoubleBooking = await this.checkDoubleBooking(
        ref.refereeId,
        match.date,
        matchId,
      );
      if (hasDoubleBooking) {
        errors.push(
          `L'arbitre ${refereeName} a déjà un match le ${match.date.toLocaleDateString('fr-FR')}`,
        );
      }

      // 3. Vérification de la disponibilité déclarée
      const isAvailable = await this.checkAvailability(
        ref.refereeId,
        match.date,
      );
      if (!isAvailable) {
        errors.push(`L'arbitre ${refereeName} est indisponible à cette date`);
      }

      // 4. Vérification de l'éligibilité de catégorie
      const isEligible = await this.checkCategoryEligibility(
        ref.refereeId,
        match.category || '',
      );
      if (!isEligible) {
        warnings.push(
          `Attention: La catégorie de l'arbitre ${refereeName} ne correspond pas aux exigences du match`,
        );
      }

      // 5. Vérification du conflit d'intérêt régional
      const hasRegionConflict = this.checkRegionConflict(
        referee.region,
        homeTeamRegion,
        awayTeamRegion,
      );
      if (hasRegionConflict) {
        errors.push(
          `Conflit d'intérêt: L'arbitre ${refereeName} (${referee.region}) ne peut pas arbitrer un match avec une équipe de sa région`,
        );
      }

      // 6. Vérification que l'arbitre peut occuper ce rôle
      const canPlayRole = this.checkRoleEligibility(referee, ref.role);
      if (!canPlayRole) {
        errors.push(
          `L'arbitre ${refereeName} n'est pas habilité pour le rôle ${ref.role}`,
        );
      }

      // 7. Vérification de la certification VAR si rôle VAR
      if (
        (ref.role === RefereeRole.ARBITRE_VAR ||
          ref.role === RefereeRole.ASSISTANT_VAR) &&
        !referee.isVARCertified
      ) {
        errors.push(
          `L'arbitre ${refereeName} n'est pas certifié VAR pour le rôle ${ref.role}`,
        );
      }

      // 8. Vérification de la charge de travail (warning seulement)
      const monthStart = new Date(match.date);
      monthStart.setDate(1);
      const monthEnd = new Date(match.date);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const withinWorkloadLimit = await this.checkWorkloadLimit(ref.refereeId, {
        start: monthStart,
        end: monthEnd,
      });
      if (!withinWorkloadLimit) {
        warnings.push(
          `Attention: L'arbitre ${refereeName} a déjà atteint la limite de matchs ce mois`,
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Vérifie si l'arbitre a déjà un match à cette journée (même saison)
   */
  async checkJourneeConflict(
    refereeId: string,
    journee: number,
    saison: string,
    competition: string,
    excludeMatchId?: string,
  ): Promise<boolean> {
    if (journee === undefined || journee === null) return false;

    // Trouver tous les matchs de cette journée pour la même compétition
    const matches = await this.matchModel
      .find({
        journee,
        saison,
        competition,
        ...(excludeMatchId
          ? { _id: { $ne: new Types.ObjectId(excludeMatchId) } }
          : {}),
      })
      .select('_id')
      .exec();

    if (matches.length === 0) return false;

    const matchIds = matches.map((m: any) => m._id as Types.ObjectId);

    // Vérifier si l'arbitre est déjà désigné pour un de ces matchs
    const existingDesignation = await this.designationModel.findOne({
      matchId: { $in: matchIds },
      'referees.refereeId': new Types.ObjectId(refereeId),
      status: { $in: ['DRAFT', 'SUBMITTED', 'VALIDATED'] },
    });

    return !!existingDesignation;
  }

  /**
   * Vérifie le conflit d'intérêt régional
   */
  checkRegionConflict(
    refereeRegion: string,
    homeTeamRegion: string | null,
    awayTeamRegion: string | null,
  ): boolean {
    if (!refereeRegion) return false;

    const normalizedRefereeRegion = refereeRegion.toLowerCase().trim();

    if (
      homeTeamRegion &&
      homeTeamRegion.toLowerCase().trim() === normalizedRefereeRegion
    ) {
      return true;
    }
    if (
      awayTeamRegion &&
      awayTeamRegion.toLowerCase().trim() === normalizedRefereeRegion
    ) {
      return true;
    }

    return false;
  }

  /**
   * Vérifie si l'arbitre peut occuper ce rôle
   */
  checkRoleEligibility(referee: RefereeDocument, role: RefereeRole): boolean {
    // Si allowedRoles n'est pas défini, on considère que l'arbitre peut tout faire
    if (!referee.allowedRoles || referee.allowedRoles.length === 0) {
      return true;
    }
    return referee.allowedRoles.includes(role) as boolean;
  }

  async checkDoubleBooking(
    refereeId: string,
    date: Date,
    excludeMatchId?: string,
  ): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const matchFilter: any = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };

    if (excludeMatchId) {
      matchFilter._id = { $ne: new Types.ObjectId(excludeMatchId) };
    }

    const matches = await this.matchModel
      .find(matchFilter)
      .select('_id')
      .exec();

    const matchIds = matches.map((m: any) => m._id as Types.ObjectId);

    if (matchIds.length === 0) return false;

    const existingDesignation = await this.designationModel.findOne({
      matchId: { $in: matchIds },
      'referees.refereeId': new Types.ObjectId(refereeId),
      status: { $in: ['DRAFT', 'SUBMITTED', 'VALIDATED'] },
    });

    return !!existingDesignation;
  }

  checkValidationPermission(
    category: string,
    userRole: Role,
  ): { allowed: boolean; reason?: string } {
    const isDesignationDNA = userRole === Role.DESIGNATION_DNA;
    const isAdminDNA = userRole === Role.ADMIN_DNA;

    if (isAdminDNA || isDesignationDNA) {
      return { allowed: true };
    }

    const roleMap: Record<string, Role[]> = {
      A: [Role.DESIGNATION_DNA],
      B: [Role.DESIGNATION_DNA],
      C1: [Role.CAA],
      C2: [Role.CAA],
      JEUNE: [Role.CAJ],
      FEMININE: [Role.CAF],
      REGIONAL: [Role.CRA],
    };

    const allowedRoles = roleMap[category];
    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      return {
        allowed: false,
        reason: 'You do not have permission to validate this designation',
      };
    }

    return { allowed: true };
  }
}
