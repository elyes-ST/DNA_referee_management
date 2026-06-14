import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RefereeCategory, RefereeRole } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

class EmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class CreateRefereeDto {
  // User account fields
  @ApiProperty({
    example: 'referee@dna.tn',
    description: 'Referee email (used for login)',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Referee123!',
    description: 'Account password (min 6 chars)',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: '+216 12345678',
    description: 'Phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  // Referee-specific fields
  @ApiProperty({ example: 'REF001', description: 'Unique referee matricule' })
  @IsString()
  @IsNotEmpty()
  matricule: string;

  @ApiProperty({
    example: 'ELITE',
    enum: RefereeCategory,
    description: 'Referee category',
  })
  @IsEnum(RefereeCategory)
  @IsNotEmpty()
  category: RefereeCategory;

  @IsString()
  @IsOptional()
  league?: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  cin: string;

  @IsString()
  @IsOptional()
  address?: string;

  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  // Rôles que l'arbitre peut occuper
  @ApiProperty({
    example: ['ARBITRE_CENTRAL', 'ASSISTANT_1', 'ASSISTANT_2'],
    description: 'Rôles autorisés pour cet arbitre',
    enum: RefereeRole,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsEnum(RefereeRole, { each: true })
  @IsOptional()
  allowedRoles?: RefereeRole[];

  // Certification VAR
  @ApiProperty({
    example: false,
    description: "Indique si l'arbitre est certifié VAR",
    required: false,
  })
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
