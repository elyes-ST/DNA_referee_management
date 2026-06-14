import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrainingResourceType, TrainingCategory } from '../../common/enums';

export class CreateTrainingResourceDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TrainingResourceType })
  @IsEnum(TrainingResourceType)
  type: TrainingResourceType;

  @ApiProperty({ enum: TrainingCategory, isArray: true })
  @IsArray()
  @IsEnum(TrainingCategory, { each: true })
  categories: TrainingCategory[];

  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCategories?: string[];

  @ApiPropertyOptional({
    description: 'IDs of specific referees for personal videos',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRefereeIds?: string[];

  @ApiPropertyOptional({
    description: 'Mark as personal video for specific referees',
  })
  @IsOptional()
  @IsBoolean()
  isPersonal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTrainingResourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TrainingResourceType })
  @IsOptional()
  @IsEnum(TrainingResourceType)
  type?: TrainingResourceType;

  @ApiPropertyOptional({ enum: TrainingCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TrainingCategory, { each: true })
  categories?: TrainingCategory[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCategories?: string[];

  @ApiPropertyOptional({
    description: 'IDs of specific referees for personal videos',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRefereeIds?: string[];

  @ApiPropertyOptional({
    description: 'Mark as personal video for specific referees',
  })
  @IsOptional()
  @IsBoolean()
  isPersonal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RateResourceDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  rating: number;
}

export class NotifyRefereesDto {
  @ApiProperty({ isArray: true })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  refereeIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];
}
