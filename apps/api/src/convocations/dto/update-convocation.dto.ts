import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConvocationType } from '../../common/enums';

export class UpdateConvocationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(ConvocationType)
  @IsOptional()
  type?: ConvocationType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  referees?: string[];
}
