import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Competition, MatchCategory, RefereeRole } from '../../common/enums';

class DesignationDto {
  @IsMongoId()
  @IsNotEmpty()
  refereeId: string;

  @IsEnum(RefereeRole)
  @IsNotEmpty()
  role: RefereeRole;

  @IsBoolean()
  @IsOptional()
  confirmed?: boolean;
}

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  matchNumber: string;

  @IsInt()
  @IsNotEmpty()
  journee: number;

  @IsString()
  @IsNotEmpty()
  saison: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  // Team IDs (références aux équipes)
  @IsMongoId()
  @IsNotEmpty()
  homeTeamId: string;

  @IsMongoId()
  @IsNotEmpty()
  awayTeamId: string;

  // Noms des équipes (optionnels, peuvent être auto-remplis)
  @IsString()
  @IsOptional()
  homeTeam?: string;

  @IsString()
  @IsOptional()
  awayTeam?: string;

  @IsString()
  @IsOptional()
  stadium?: string; // Peut être auto-rempli depuis l'équipe à domicile

  @IsEnum(Competition)
  @IsNotEmpty()
  competition: Competition;

  @IsEnum(MatchCategory)
  @IsNotEmpty()
  category: MatchCategory;

  @IsBoolean()
  @IsOptional()
  hasVAR?: boolean; // Indique si le match utilise la VAR

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignationDto)
  @IsOptional()
  designations?: DesignationDto[];
}
