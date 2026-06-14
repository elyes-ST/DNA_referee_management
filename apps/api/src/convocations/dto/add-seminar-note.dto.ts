import { IsMongoId, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class AddSeminarNoteDto {
  @IsMongoId()
  @IsNotEmpty()
  refereeId: string;

  @IsNumber()
  @Min(0)
  @Max(20)
  @IsNotEmpty()
  note: number;
}
