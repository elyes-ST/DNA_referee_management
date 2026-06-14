import { IsOptional, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {TrainingResourceType,TrainingCategory} from '../../common/enums'
export class FilterTrainingResourcesDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by resource type',
    enum: TrainingResourceType,
  })
  @IsOptional()
  @IsEnum(TrainingResourceType)
  type?: TrainingResourceType;
  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: TrainingCategory,
  })
  @IsOptional()
  @IsEnum(TrainingCategory)
  category?: TrainingCategory;
  @ApiPropertyOptional({ description: 'Filter by target audience (category)' })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'Search by title or description' })
  @IsOptional()
  @IsString()
  search?: string;
}
