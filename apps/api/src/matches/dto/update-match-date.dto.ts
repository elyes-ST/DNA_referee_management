import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateMatchDateDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
