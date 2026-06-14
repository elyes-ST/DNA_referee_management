import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RefereeRole, PaymentStatus } from '../../common/enums';

export class CreateMatchPaymentDto {
  @IsNotEmpty()
  @IsString()
  matchId: string;

  @IsNotEmpty()
  @IsString()
  refereeId: string;

  @IsNotEmpty()
  @IsEnum(RefereeRole)
  role: RefereeRole;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMatchPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

export class CalculateMatchPaymentsDto {
  @IsNotEmpty()
  @IsString()
  startDate: string; // ISO date: YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  endDate: string; // ISO date: YYYY-MM-DD (exclusive upper bound)

  @IsOptional()
  @IsString()
  saison?: string; // Optional context for rate lookup (e.g. "2025-2026")
}
