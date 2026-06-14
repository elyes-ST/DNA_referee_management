import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto';
import { RefereeCategory, RefereeRole } from '../../common/enums';

export class FilterRefereesDto extends PaginationDto {
  @IsEnum(RefereeRole)
  @IsOptional()
  allowedRole?: RefereeRole;
  /** Single value (`C1`) or comma-separated list (`C1,C2`) — parsed into an array */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    if (Array.isArray(value)) return value;
    return value.split(',').map((c: string) => c.trim());
  })
  @IsEnum(RefereeCategory, { each: true })
  category?: RefereeCategory[];

  @IsString()
  @IsOptional()
  league?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ obj, key }) => {
    if (obj[key] === 'true' || obj[key] === true) return true;
    if (obj[key] === 'false' || obj[key] === false) return false;
    return obj[key];
  })
  isAvailable?: boolean;

  /** Filter by referee's VAR certification */
  @IsBoolean()
  @IsOptional()
  @Transform(({ obj, key }) => {
    if (obj[key] === 'true' || obj[key] === true) return true;
    if (obj[key] === 'false' || obj[key] === false) return false;
    return obj[key];
  })
  isVARCertified?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ obj, key }) => {
    if (obj[key] === 'true' || obj[key] === true) return true;
    if (obj[key] === 'false' || obj[key] === false) return false;
    return obj[key];
  })
  isActive?: boolean;

  /** Search by firstName, lastName, email (via User) or matricule */
  @IsString()
  @IsOptional()
  search?: string;

  /** Maximum age filter */
  @IsOptional()
  @Type(() => Number)
  maxAge?: number;

  /** Minimum age filter */
  @IsOptional()
  @Type(() => Number)
  minAge?: number;
}
