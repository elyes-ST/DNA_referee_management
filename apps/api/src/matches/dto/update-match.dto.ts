import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  IsMongoId,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Competition, MatchCategory, MatchStatus } from '../../common/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ScoreDto {
  @ApiPropertyOptional({ description: 'Home team score', example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @ApiPropertyOptional({ description: 'Away team score', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;
}

export class UpdateMatchDto {
  @ApiPropertyOptional({ description: 'Match number', example: 'M2026-001' })
  @IsString()
  @IsOptional()
  matchNumber?: string;

  @ApiPropertyOptional({ description: 'Match day number', example: 15 })
  @IsInt()
  @IsOptional()
  journee?: number;

  @ApiPropertyOptional({ description: 'Season', example: '2025-2026' })
  @IsString()
  @IsOptional()
  saison?: string;

  @ApiPropertyOptional({
    description: 'Match date',
    example: '2026-02-15',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Match time', example: '20:00' })
  @IsString()
  @IsOptional()
  time?: string;

  @ApiPropertyOptional({ description: 'Home team ID' })
  @IsMongoId()
  @IsOptional()
  homeTeamId?: string;

  @ApiPropertyOptional({ description: 'Away team ID' })
  @IsMongoId()
  @IsOptional()
  awayTeamId?: string;

  @ApiPropertyOptional({ description: 'Home team name', example: 'EST' })
  @IsString()
  @IsOptional()
  homeTeam?: string;

  @ApiPropertyOptional({ description: 'Away team name', example: 'CA' })
  @IsString()
  @IsOptional()
  awayTeam?: string;

  @ApiPropertyOptional({ description: 'Stadium name', example: 'Stade Olympique' })
  @IsString()
  @IsOptional()
  stadium?: string;

  @ApiPropertyOptional({
    description: 'Competition',
    enum: Competition,
  })
  @IsEnum(Competition)
  @IsOptional()
  competition?: Competition;

  @ApiPropertyOptional({
    description: 'Match category',
    enum: MatchCategory,
  })
  @IsEnum(MatchCategory)
  @IsOptional()
  category?: MatchCategory;

  @ApiPropertyOptional({
    description: 'Match status',
    enum: MatchStatus,
  })
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @ApiPropertyOptional({ description: 'Has VAR technology', example: false })
  @IsBoolean()
  @IsOptional()
  hasVAR?: boolean;

  @ApiPropertyOptional({
    description: 'Match score (only when match is completed)',
    type: ScoreDto,
  })
  @ValidateNested()
  @Type(() => ScoreDto)
  @IsOptional()
  score?: ScoreDto;
}
