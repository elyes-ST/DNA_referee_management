import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInspectorDto {
  // User account fields
  @ApiProperty({
    example: 'inspector@dna.tn',
    description: 'Inspector email (used for login)',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Inspector123!',
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

  // Inspector-specific fields
  @ApiProperty({ example: 'INS001', description: 'Unique inspector matricule' })
  @IsString()
  @IsNotEmpty()
  matricule: string;

  @ApiProperty({ example: 'Tunis', description: 'Inspector region' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({
    example: 'Technical inspection',
    description: 'Inspector specialization',
    required: false,
  })
  @IsString()
  @IsOptional()
  specialization?: string;
}
