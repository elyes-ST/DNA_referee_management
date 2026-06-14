import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Competition } from '../../common/enums';
import { PaginationDto } from '../../common/dto';

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Ex: Etoile Sportive du Sahel

  @IsNotEmpty()
  @IsString()
  shortName: string; // Ex: ESS

  @IsNotEmpty()
  @IsString()
  city: string; // Ex: Sousse

  @IsNotEmpty()
  @IsString()
  region: string; // Ex: Sousse

  @IsNotEmpty()
  @IsEnum(Competition)
  league: Competition;

  @IsOptional()
  @IsString()
  stadium?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(Competition)
  league?: Competition;

  @IsOptional()
  @IsString()
  stadium?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FilterTeamsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(Competition)
  league?: Competition;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
