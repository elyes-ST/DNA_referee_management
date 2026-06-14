import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class EmergencyContactDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Jane Doe' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '+216 87654321' })
  phone?: string;
}

/**
 * DTO for referees to update their own profile
 * Only allows updating non-sensitive fields
 */
export class UpdateMyRefereeProfileDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Referee address',
    example: '123 Avenue Habib Bourguiba, Tunis',
  })
  address?: string;

  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Emergency contact information',
    type: EmergencyContactDto,
  })
  emergencyContact?: EmergencyContactDto;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Personal notes',
    example: 'Available weekends only',
  })
  notes?: string;
}
