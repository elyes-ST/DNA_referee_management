import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MatchSheetScoreDto {
  @ApiProperty({ description: 'Home team score', example: 2 })
  @IsInt()
  @Min(0)
  homeScore: number;

  @ApiProperty({ description: 'Away team score', example: 1 })
  @IsInt()
  @Min(0)
  awayScore: number;
}

export class SubmitMatchSheetDto {
  @ApiProperty({
    description: 'Final score of the match',
    type: MatchSheetScoreDto,
  })
  @ValidateNested()
  @Type(() => MatchSheetScoreDto)
  score: MatchSheetScoreDto;

  @ApiPropertyOptional({
    description: 'Additional notes or observations from the CRA',
    example: "Match s'est déroulé sans incidents notables.",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
