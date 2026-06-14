import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@dna.tn',
    description: 'Email address to send password reset link',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
