import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InspectionType,
  InspectorVerdict,
  PromotionRecommendation,
} from '../../common/enums';

export class TechnicalScoresDto {
  @ApiProperty({ minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  technicalScore: number;

  @ApiProperty({ minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  physicalScore: number;

  @ApiProperty({ minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  psychologicalScore: number;

  @ApiProperty({ minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  communicationScore: number;

  @ApiProperty({ minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  decisionMakingScore: number;
}

export class CreateInspectorReportDto {
  @ApiProperty()
  @IsString()
  inspectorId: string;

  @ApiProperty()
  @IsString()
  refereeId: string;

  @ApiProperty()
  @IsString()
  matchId: string;

  @ApiProperty()
  @IsDateString()
  inspectionDate: string;

  @ApiProperty({ enum: InspectionType })
  @IsEnum(InspectionType)
  inspectionType: InspectionType;

  @ApiProperty({ type: TechnicalScoresDto })
  @ValidateNested()
  @Type(() => TechnicalScoresDto)
  scores: TechnicalScoresDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weaknesses?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trainingNeeds?: string[];

  @ApiProperty({ enum: InspectorVerdict })
  @IsEnum(InspectorVerdict)
  verdict: InspectorVerdict;

  @ApiProperty({ enum: PromotionRecommendation })
  @IsEnum(PromotionRecommendation)
  promotionRecommendation: PromotionRecommendation;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  confidential?: boolean;
}

export class UpdateInspectorReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @ApiPropertyOptional({ enum: InspectionType })
  @IsOptional()
  @IsEnum(InspectionType)
  inspectionType?: InspectionType;

  @ApiPropertyOptional({ type: TechnicalScoresDto })
  @IsOptional()
  scores?: TechnicalScoresDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weaknesses?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trainingNeeds?: string[];

  @ApiPropertyOptional({ enum: InspectorVerdict })
  @IsOptional()
  @IsEnum(InspectorVerdict)
  verdict?: InspectorVerdict;

  @ApiPropertyOptional({ enum: PromotionRecommendation })
  @IsOptional()
  @IsEnum(PromotionRecommendation)
  promotionRecommendation?: PromotionRecommendation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  confidential?: boolean;
}
