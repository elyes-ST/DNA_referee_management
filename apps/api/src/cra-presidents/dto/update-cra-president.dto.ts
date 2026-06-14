import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateCRAPresidentDto {
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;
}
