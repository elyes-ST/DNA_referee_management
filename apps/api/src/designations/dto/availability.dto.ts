import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType, AvailabilityUrgency } from '../../common/enums';

export class CreateAvailabilityDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Referee ID to report availability for',
    example: '507f1f77bcf86cd799439011',
  })
  refereeId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Start date of unavailability',
    example: '2026-02-15',
  })
  dateFrom: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'End date of unavailability',
    example: '2026-02-20',
  })
  dateTo: string;

  @IsNotEmpty()
  @IsEnum(AvailabilityType)
  @ApiProperty({
    description: 'Type of unavailability',
    enum: AvailabilityType,
    example: AvailabilityType.INJURED,
  })
  type: AvailabilityType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Detailed reason for the unavailability',
    example: "Blessure au genou lors de l'entraînement",
  })
  reason?: string;

  @IsOptional()
  @IsEnum(AvailabilityUrgency)
  @ApiPropertyOptional({
    description: 'Urgency level of the notification',
    enum: AvailabilityUrgency,
    default: AvailabilityUrgency.NORMAL,
  })
  urgency?: AvailabilityUrgency;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Whether to notify the CRA president of the referee's region",
    default: true,
  })
  notifyCRA?: boolean;
}

/**
 * DTO for referees to report their own unavailability (injury, excuse)
 * Implements user story: referee informs CRA directly about injury/excuse
 */
export class ReportMyUnavailabilityDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Start date of unavailability',
    example: '2026-02-15',
  })
  dateFrom: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'End date of unavailability',
    example: '2026-02-20',
  })
  dateTo: string;

  @IsNotEmpty()
  @IsEnum(AvailabilityType)
  @ApiProperty({
    description: 'Type of unavailability (INJURED, EXCUSED, SICK, PERSONAL)',
    enum: AvailabilityType,
    example: AvailabilityType.INJURED,
  })
  type: AvailabilityType;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Detailed reason for the unavailability (required for CRA notification)',
    example: 'Blessure au genou droit, certificat médical joint',
  })
  reason: string;

  @IsOptional()
  @IsEnum(AvailabilityUrgency)
  @ApiPropertyOptional({
    description:
      'Urgency level - IMMEDIATE for same day, URGENT for 1-2 days, NORMAL for planned absence',
    enum: AvailabilityUrgency,
    default: AvailabilityUrgency.NORMAL,
  })
  urgency?: AvailabilityUrgency;
}

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(AvailabilityType)
  type?: AvailabilityType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(AvailabilityUrgency)
  urgency?: AvailabilityUrgency;
}

export class ApproveAvailabilityDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Optional notes or response message (e.g., CRA acknowledgement)',
    example: 'Pris en compte, bon rétablissement',
  })
  response?: string;
}

export class RejectAvailabilityDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Délai insuffisant pour la demande',
  })
  reason: string;
}
