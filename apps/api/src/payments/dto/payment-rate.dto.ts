import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RefereeCategory, Competition, RefereeRole } from '../../common/enums';

export class CreatePaymentRateDto {
  @IsNotEmpty()
  @IsEnum(RefereeCategory)
  category: RefereeCategory;

  @IsNotEmpty()
  @IsEnum(Competition)
  competition: Competition;

  @IsNotEmpty()
  @IsEnum(RefereeRole)
  role: RefereeRole;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;


}

export class UpdatePaymentRateDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

export class FilterPaymentRatesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(RefereeCategory)
  category?: RefereeCategory;

  @IsOptional()
  @IsEnum(Competition)
  competition?: Competition;

}

export class CalculatePaymentDto {
  @IsNotEmpty()
  @IsString()
  matchId: string;

  @IsNotEmpty()
  @IsEnum(RefereeRole)
  role: RefereeRole;

  @IsNotEmpty()
  @IsString()
  category: string;
}
