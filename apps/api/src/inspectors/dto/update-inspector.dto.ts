import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateInspectorDto {
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  matricule?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  specialization?: string;
}
