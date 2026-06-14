import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto';
import { RefereeCategory } from '../../common/enums';

export class FilterRefereesDto extends PaginationDto {
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
  @Type(() => Boolean)
  isAvailable?: boolean;

  /** Filter by referee's VAR certification */
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isVARCertified?: boolean;

  /** Filter by linked User account status */
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  /** Search by firstName, lastName, email (via User) or matricule */
  @IsString()
  @IsOptional()
  search?: string;
}
