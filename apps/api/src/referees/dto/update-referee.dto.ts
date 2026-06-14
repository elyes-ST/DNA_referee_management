import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RefereeCategory, RefereeRole } from '../../common/enums';

class EmergencyContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateRefereeDto {
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  matricule?: string;

  @IsEnum(RefereeCategory)
  @IsOptional()
  category?: RefereeCategory;

  @IsString()
  @IsOptional()
  league?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  cin?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  // Rôles autorisés pour cet arbitre
  @IsArray()
  @IsEnum(RefereeRole, { each: true })
  @IsOptional()
  allowedRoles?: RefereeRole[];

  // Certification VAR
  @IsBoolean()
  @IsOptional()
  isVARCertified?: boolean;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
