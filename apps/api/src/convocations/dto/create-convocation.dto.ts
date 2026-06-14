import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConvocationType } from '../../common/enums';

export class CreateConvocationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ConvocationType)
  @IsNotEmpty()
  type: ConvocationType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  referees?: string[];
}
