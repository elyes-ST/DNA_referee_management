import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus } from '../schemas/inspector-assignment.schema';

export class CreateInspectorAssignmentDto {
  @ApiProperty({ description: 'Match ID to assign inspector to' })
  @IsMongoId()
  @IsNotEmpty()
  matchId: string;

  @ApiProperty({ description: 'Inspector ID to assign' })
  @IsMongoId()
  @IsNotEmpty()
  inspectorId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInspectorAssignmentDto {
  @ApiProperty({ enum: AssignmentStatus, required: false })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelAssignmentDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class FilterAssignmentsDto {
  @IsOptional()
  @IsMongoId()
  matchId?: string;

  @IsOptional()
  @IsMongoId()
  inspectorId?: string;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;
}
