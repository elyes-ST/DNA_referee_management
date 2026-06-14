import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  PaymentStatus,
  PaymentMethod,
  RefereeCategory,
} from '../../common/enums';

export class FilterPaymentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  /** Single value (`C1`) or comma-separated list (`C1,C2`) — parsed into an array */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    if (Array.isArray(value)) return value;
    return value.split(',').map((c: string) => c.trim());
  })
  @IsEnum(RefereeCategory, { each: true })
  category?: RefereeCategory[];

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  saison?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  refereeId?: string;
}

/** Step 3 — query params: get matches the referee worked on in the date range */
export class PreviewMatchesDto {
  @IsNotEmpty()
  @IsString()
  refereeId: string;

  @IsNotEmpty()
  @IsString()
  startDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  endDate: string; // YYYY-MM-DD
}

/** Step 5 — body: calculate total for a curated list of match IDs */
export class PreviewTotalDto {
  @IsNotEmpty()
  @IsString()
  refereeId: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  matchIds: string[];
}

/** Step 6 — create invoice */
export class GeneratePaymentDto {
  @IsNotEmpty()
  @IsString()
  refereeId: string;

  @IsNotEmpty()
  @IsString()
  startDate: string; // ISO date: YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  endDate: string; // ISO date: YYYY-MM-DD (exclusive upper bound)

  @IsOptional()
  @IsString()
  label?: string; // e.g. "Janvier 2026" — shown in PDF and notifications

  /**
   * Optional curated match IDs selected by the admin.
   * If provided, only these matches are included in the invoice.
   * If omitted, all completed matches in [startDate, endDate) are used.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchIds?: string[];
}

export class ValidatePaymentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectPaymentDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class MarkPaidDto {
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkValidateDto {
  @IsNotEmpty()
  @IsString({ each: true })
  paymentIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentStatisticsDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  saison?: string;

  @IsOptional()
  @IsEnum(RefereeCategory)
  category?: RefereeCategory;
}
