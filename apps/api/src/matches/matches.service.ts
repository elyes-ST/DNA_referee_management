import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchDocument } from './schemas/match.schema';
import { Team, TeamDocument } from '../teams/schemas/team.schema';
import {
  CreateMatchDto,
  UpdateMatchDto,
  FilterMatchesDto,
  UpdateMatchDateDto,
  SubmitMatchSheetDto,
} from './dto';
import { PaginatedResult } from '../common/dto';
import { ExcelService, ImportResult } from '../common/services';
import { MatchStatus } from '../common/enums';
import { getAllowedCategoriesForRole } from '../common/helpers';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    private excelService: ExcelService,
  ) { }

  async create(
    createMatchDto: CreateMatchDto,
    createdBy: string,
    userRole?: string,
  ): Promise<Match> {
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(createMatchDto.category || 'A')) {
      throw new ForbiddenException(
        `Vous n'êtes pas autorisé à créer un match pour la catégorie ${createMatchDto.category || 'A'}`,
      );
    }
    // Récupérer les informations des équipes
    const homeTeam = await this.teamModel.findById(createMatchDto.homeTeamId);
    if (!homeTeam) {
      throw new BadRequestException(
        `L'équipe à domicile avec l'ID ${createMatchDto.homeTeamId} est introuvable`,
      );
    }

    const awayTeam = await this.teamModel.findById(createMatchDto.awayTeamId);
    if (!awayTeam) {
      throw new BadRequestException(
        `L'équipe extérieure avec l'ID ${createMatchDto.awayTeamId} est introuvable`,
      );
    }

    // Auto-remplir les noms et le stade
    const matchData = {
      ...createMatchDto,
      homeTeamId: new Types.ObjectId(createMatchDto.homeTeamId),
      awayTeamId: new Types.ObjectId(createMatchDto.awayTeamId),
      homeTeam: createMatchDto.homeTeam || homeTeam.name,
      awayTeam: createMatchDto.awayTeam || awayTeam.name,
      stadium: createMatchDto.stadium || homeTeam.stadium || 'Stade non défini',
      createdBy: new Types.ObjectId(createdBy),
    };

    const createdMatch = new this.matchModel(matchData);
    return createdMatch.save();
  }

  async findAll(filterDto: FilterMatchesDto, userRole?: string): Promise<PaginatedResult<Match>> {
    const {
      page = 1,
      limit = 10,
      journee,
      saison,
      date,
      competition,
      status,
      category,
      team,
      stadium,
      matchNumber,
    } = filterDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (journee) filter.journee = journee;
    if (saison) filter.saison = saison;
    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }
    if (competition) filter.competition = competition;
    if (status) filter.status = status;
    if (matchNumber) filter.matchNumber = { $regex: matchNumber, $options: 'i' };
    if (stadium) filter.stadium = { $regex: stadium, $options: 'i' };
    if (team) {
      filter.$or = [
        { homeTeam: { $regex: team, $options: 'i' } },
        { awayTeam: { $regex: team, $options: 'i' } },
      ];
    }

    // Category may be a single value or a list (e.g. C1,C2). Intersect any
    // requested categories with the role's allowed scope so RBAC is preserved.
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    const requestedCategories = category
      ? Array.isArray(category)
        ? category
        : [category]
      : null;
    if (requestedCategories && requestedCategories.length > 0) {
      filter.category = {
        $in: allowedCategories
          ? requestedCategories.filter((c) => allowedCategories.includes(c))
          : requestedCategories,
      };
    } else if (allowedCategories) {
      filter.category = { $in: allowedCategories };
    }

    const [data, total] = await Promise.all([
      this.matchModel
        .find(filter)
        .populate('designations.refereeId')
        .populate('createdBy', '-password')
        .skip(skip)
        .limit(limit)
        .sort({ date: 1, journee: 1 })
        .exec(),
      this.matchModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userRole?: string): Promise<Match> {
    const match = await this.matchModel
      .findById(id)
      .populate('designations.refereeId')
      .populate('createdBy', '-password')
      .exec();
    if (!match) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(match.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce match");
    }
    return match;
  }

  async getCalendar(saison?: string, startDate?: string, endDate?: string, userRole?: string) {
    // Build query based on provided filters
    const query: any = {};

    if (saison) {
      query.saison = saison;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories) {
      query.category = { $in: allowedCategories };
    }

    const matches = await this.matchModel
      .find(query)
      .populate('designations.refereeId')
      .sort({ journee: 1, date: 1 })
      .exec();

    // Group by journee
    const calendar = matches.reduce((acc: Record<number, any[]>, match) => {
      const journee = match.journee;
      if (!acc[journee]) {
        acc[journee] = [];
      }
      acc[journee].push(match);
      return acc;
    }, {});

    return calendar;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto, userRole?: string): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(match.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce match");
    }

    // If team IDs are being updated, fetch team names
    const updateData: any = { ...updateMatchDto };

    if (updateMatchDto.homeTeamId) {
      const homeTeam = await this.teamModel.findById(updateMatchDto.homeTeamId);
      if (!homeTeam) {
        throw new BadRequestException(
          `L'équipe à domicile avec l'ID ${updateMatchDto.homeTeamId} est introuvable`,
        );
      }
      updateData.homeTeamId = new Types.ObjectId(updateMatchDto.homeTeamId);
      // Update team name if not explicitly provided
      if (!updateMatchDto.homeTeam) {
        updateData.homeTeam = homeTeam.name;
      }
    }

    if (updateMatchDto.awayTeamId) {
      const awayTeam = await this.teamModel.findById(updateMatchDto.awayTeamId);
      if (!awayTeam) {
        throw new BadRequestException(
          `L'équipe extérieure avec l'ID ${updateMatchDto.awayTeamId} est introuvable`,
        );
      }
      updateData.awayTeamId = new Types.ObjectId(updateMatchDto.awayTeamId);
      // Update team name if not explicitly provided
      if (!updateMatchDto.awayTeam) {
        updateData.awayTeam = awayTeam.name;
      }
    }

    const updatedMatch = await this.matchModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('designations.refereeId')
      .populate('createdBy', '-password')
      .exec();

    if (!updatedMatch) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }

    return updatedMatch;
  }

  async updateDate(
    id: string,
    updateMatchDateDto: UpdateMatchDateDto,
    userRole?: string,
  ): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(match.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce match");
    }

    const updatedMatch = await this.matchModel
      .findByIdAndUpdate(
        id,
        { date: new Date(updateMatchDateDto.date) },
        { new: true },
      )
      .populate('designations.refereeId')
      .populate('createdBy', '-password')
      .exec();

    if (!updatedMatch) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }

    return updatedMatch;
  }

  async remove(id: string, userRole?: string): Promise<void> {
    const match = await this.matchModel.findById(id).exec();
    if (!match) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(match.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer ce match");
    }
    
    await this.matchModel.findByIdAndDelete(id).exec();
  }

  async importFromExcel(
    buffer: Buffer,
    createdBy: string,
    userRole?: string,
  ): Promise<ImportResult> {
    const data = this.excelService.parseExcelFile(buffer);
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const validation = this.excelService.validateMatchData(row);

      if (!validation.isValid) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: validation.errors.join(', '),
          data: row,
        });
        continue;
      }

      try {
        const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
        const rowCategory = row.category || 'A';

        if (allowedCategories && !allowedCategories.includes(rowCategory)) {
          throw new ForbiddenException(`Ligne ${i + 2}: Catégorie ${rowCategory} non autorisée`);
        }
        // Chercher les équipes par nom dans la base de données
        const homeTeam = await this.teamModel.findOne({
          name: { $regex: new RegExp(`^${row.homeTeam.trim()}$`, 'i') },
        });

        if (!homeTeam) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            error: `Équipe à domicile "${row.homeTeam}" non trouvée dans la base de données`,
            data: row,
          });
          continue;
        }

        const awayTeam = await this.teamModel.findOne({
          name: { $regex: new RegExp(`^${row.awayTeam.trim()}$`, 'i') },
        });

        if (!awayTeam) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            error: `Équipe extérieure "${row.awayTeam}" non trouvée dans la base de données`,
            data: row,
          });
          continue;
        }

        // Créer le match avec les références aux équipes
        await this.matchModel.create({
          matchNumber: row.matchNumber,
          journee: row.journee,
          saison: row.saison,
          date: this.excelService.parseExcelDate(row.date) || new Date(row.date),
          time: row.time || '00:00',
          homeTeamId: homeTeam._id,
          awayTeamId: awayTeam._id,
          homeTeam: homeTeam.name,
          awayTeam: awayTeam.name,
          stadium: row.stadium || homeTeam.stadium || 'Stade non défini',
          competition: row.competition,
          category: row.category || 'A',
          createdBy: new Types.ObjectId(createdBy),
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: error.message,
          data: row,
        });
      }
    }

    return result;
  }

  /**
   * CRA submits a match sheet (result) to DNA.
   * Marks the match as COMPLETED with the provided score and records the submitter.
   */
  async submitMatchSheet(
    id: string,
    dto: SubmitMatchSheetDto,
    craUserId: string,
    userRole?: string,
  ): Promise<Match> {
    const match = await this.matchModel.findById(id).exec();
    if (!match) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(match.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à soumettre une feuille de match pour cette catégorie");
    }

    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException(
        'Ce match est déjà marqué comme terminé',
      );
    }

    const updatedMatch = await this.matchModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: MatchStatus.COMPLETED,
            score: {
              homeScore: dto.score.homeScore,
              awayScore: dto.score.awayScore,
            },
            sheetSubmittedBy: new Types.ObjectId(craUserId),
            sheetSubmittedAt: new Date(),
            ...(dto.notes ? { sheetNotes: dto.notes } : {}),
          },
        },
        { new: true },
      )
      .populate('designations.refereeId')
      .populate('createdBy', '-password')
      .exec();

    if (!updatedMatch) {
      throw new NotFoundException(`Le match avec l'ID ${id} est introuvable`);
    }

    return updatedMatch;
  }
}
