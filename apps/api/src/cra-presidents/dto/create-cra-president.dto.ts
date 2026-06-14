import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCRAPresidentDto {
  // User account fields
  @ApiProperty({
    example: 'cra.president@dna.tn',
    description: 'CRA President email (used for login)',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'CRA123!',
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

  // CRA President-specific fields
  @ApiProperty({ example: 'Tunis', description: 'Region' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({
    example: '2026-01-01',
    description: 'Start date of presidency',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;
}
