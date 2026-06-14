import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto';
import { Competition, MatchStatus, MatchCategory } from '../../common/enums';

export class FilterMatchesDto extends PaginationDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  journee?: number;

  @IsString()
  @IsOptional()
  saison?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(Competition)
  @IsOptional()
  competition?: Competition;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  /** Single value (`C1`) or comma-separated list (`C1,C2`) — parsed into an array */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    if (Array.isArray(value)) return value;
    return value.split(',').map((c: string) => c.trim());
  })
  @IsEnum(MatchCategory, { each: true })
  category?: MatchCategory[];

  /** Partial team name search — matches homeTeam or awayTeam (case-insensitive) */
  @IsString()
  @IsOptional()
  team?: string;

  /** Filter by stadium name (case-insensitive) */
  @IsString()
  @IsOptional()
  stadium?: string;

  /** Filter by match number */
  @IsString()
  @IsOptional()
  matchNumber?: string;
}
