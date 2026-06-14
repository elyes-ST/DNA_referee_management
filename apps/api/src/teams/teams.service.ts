import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument } from './schemas/team.schema';
import { CreateTeamDto, UpdateTeamDto, FilterTeamsDto } from './dto/team.dto';
import { PaginatedResult } from '../common/dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<TeamDocument>) { }

  async create(createDto: CreateTeamDto, userId: string): Promise<Team> {
    // Check if team with same name already exists
    const existingTeam = await this.teamModel.findOne({
      $or: [{ name: createDto.name }, { shortName: createDto.shortName }],
    });

    if (existingTeam) {
      throw new ConflictException(
        'Une équipe avec ce nom ou ce sigle existe déjà',
      );
    }

    const team = await this.teamModel.create({
      ...createDto,
      createdBy: new Types.ObjectId(userId),
    });

    return team;
  }

  async findAll(filterDto: FilterTeamsDto = {}): Promise<PaginatedResult<Team>> {
    const query: any = {};
    const { page = 1, limit = 10, region, league, isActive, search } = filterDto;
    const skip = (page - 1) * limit;

    if (region) query.region = region;
    if (league) query.league = league;
    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.teamModel.find(query).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.teamModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Team> {
    const team = await this.teamModel.findById(id);
    if (!team) {
      throw new NotFoundException(`Équipe avec ID ${id} non trouvée`);
    }
    return team;
  }

  async findByRegion(region: string): Promise<Team[]> {
    return this.teamModel.find({ region, isActive: true }).exec();
  }

  async findByLeague(league: string): Promise<Team[]> {
    return this.teamModel.find({ league, isActive: true }).exec();
  }

  async update(id: string, updateDto: UpdateTeamDto): Promise<Team> {
    const team = await this.teamModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );

    if (!team) {
      throw new NotFoundException(`Équipe avec ID ${id} non trouvée`);
    }

    return team;
  }

  async delete(id: string): Promise<void> {
    const result = await this.teamModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Équipe avec ID ${id} non trouvée`);
    }
  }

  /**
   * Get team by name or short name
   */
  async findByNameOrShortName(nameOrShort: string): Promise<Team | null> {
    return this.teamModel.findOne({
      $or: [
        { name: { $regex: new RegExp(nameOrShort, 'i') } },
        { shortName: { $regex: new RegExp(nameOrShort, 'i') } },
      ],
    });
  }

  /**
   * Get all regions with teams
   */
  async getRegions(): Promise<string[]> {
    return this.teamModel.distinct('region').exec();
  }

  /**
   * Seed initial teams (for development)
   */
  async seedTeams(): Promise<void> {
    const teams = [
      // Ligue 1
      {
        name: 'Espérance Sportive de Tunis',
        shortName: 'EST',
        city: 'Tunis',
        region: 'Tunis',
        league: 'LIGUE1',
        stadium: 'Stade Olympique de Radès',
      },
      {
        name: 'Club Africain',
        shortName: 'CA',
        city: 'Tunis',
        region: 'Tunis',
        league: 'LIGUE1',
        stadium: 'Stade Olympique de Radès',
      },
      {
        name: 'Étoile Sportive du Sahel',
        shortName: 'ESS',
        city: 'Sousse',
        region: 'Sousse',
        league: 'LIGUE1',
        stadium: 'Stade Olympique de Sousse',
      },
      {
        name: 'Club Sportif Sfaxien',
        shortName: 'CSS',
        city: 'Sfax',
        region: 'Sfax',
        league: 'LIGUE1',
        stadium: 'Stade Taïeb Mhiri',
      },
      {
        name: 'Union Sportive de Ben Guerdane',
        shortName: 'USBG',
        city: 'Ben Guerdane',
        region: 'Médenine',
        league: 'LIGUE1',
        stadium: 'Stade de Ben Guerdane',
      },
      {
        name: 'Club Sportif de Hammam Lif',
        shortName: 'CSHL',
        city: 'Hammam Lif',
        region: 'Ben Arous',
        league: 'LIGUE1',
        stadium: 'Stade de Hammam Lif',
      },
      {
        name: 'Stade Tunisien',
        shortName: 'ST',
        city: 'Tunis',
        region: 'Tunis',
        league: 'LIGUE1',
        stadium: 'Stade Chadly Zouiten',
      },
      {
        name: 'Olympique de Béja',
        shortName: 'OB',
        city: 'Béja',
        region: 'Béja',
        league: 'LIGUE1',
        stadium: 'Stade 15 Octobre',
      },
      {
        name: 'US Monastir',
        shortName: 'USM',
        city: 'Monastir',
        region: 'Monastir',
        league: 'LIGUE1',
        stadium: 'Stade Mustapha Ben Jannet',
      },
      {
        name: 'ES Métlaoui',
        shortName: 'ESM',
        city: 'Métlaoui',
        region: 'Gafsa',
        league: 'LIGUE1',
        stadium: 'Stade de Métlaoui',
      },
      {
        name: 'AS Gabès',
        shortName: 'ASG',
        city: 'Gabès',
        region: 'Gabès',
        league: 'LIGUE1',
        stadium: 'Stade Taieb Mhiri',
      },
      {
        name: 'CA Bizertin',
        shortName: 'CAB',
        city: 'Bizerte',
        region: 'Bizerte',
        league: 'LIGUE1',
        stadium: 'Stade 15 Octobre 1963',
      },
      // Ligue 2
      {
        name: 'AS Soliman',
        shortName: 'ASS',
        city: 'Soliman',
        region: 'Nabeul',
        league: 'LIGUE2',
        stadium: 'Stade Municipal de Soliman',
      },
      {
        name: 'ES Zarzis',
        shortName: 'ESZ',
        city: 'Zarzis',
        region: 'Médenine',
        league: 'LIGUE2',
        stadium: 'Stade de Zarzis',
      },
      {
        name: 'Jendouba Sport',
        shortName: 'JS',
        city: 'Jendouba',
        region: 'Jendouba',
        league: 'LIGUE2',
        stadium: 'Stade de Jendouba',
      },
      {
        name: 'AS Marsa',
        shortName: 'ASM',
        city: 'La Marsa',
        region: 'Tunis',
        league: 'LIGUE2',
        stadium: 'Stade de La Marsa',
      },
    ];

    for (const teamData of teams) {
      const exists = await this.teamModel.findOne({
        shortName: teamData.shortName,
      });
      if (!exists) {
        await this.teamModel.create(teamData);
      }
    }
  }

  async uploadLogo(id: string, file: Express.Multer.File): Promise<Team> {
    const team = await this.teamModel.findById(id);
    if (!team) {
      // Supprimer le fichier uploadé si l'équipe n'existe pas
      fs.unlinkSync(file.path);
      throw new NotFoundException(`Équipe avec ID ${id} non trouvée`);
    }

    // Supprimer l'ancien logo si existant
    if (team.logo) {
      const oldLogoPath = path.join(
        process.cwd(),
        'uploads',
        'team-logos',
        path.basename(team.logo),
      );
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Mettre à jour l'URL du logo (chemin relatif)
    const logoUrl = `/uploads/team-logos/${file.filename}`;
    team.logo = logoUrl;
    await team.save();

    return team;
  }

  async deleteLogo(id: string): Promise<Team> {
    const team = await this.teamModel.findById(id);
    if (!team) {
      throw new NotFoundException(`Équipe avec ID ${id} non trouvée`);
    }

    if (!team.logo) {
      throw new BadRequestException("Cette équipe n'a pas de logo");
    }

    // Supprimer le fichier physique
    const logoPath = path.join(
      process.cwd(),
      'uploads',
      'team-logos',
      path.basename(team.logo),
    );
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    // Supprimer le logo de la base de données
    team.logo = null;
    await team.save();

    return team;
  }
}
