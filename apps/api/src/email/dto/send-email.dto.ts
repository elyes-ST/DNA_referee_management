import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Recipient email address',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    example: 'Bienvenue sur DNA',
    description: 'Email subject',
  })
  @IsString()
  subject: string;

  @ApiPropertyOptional({
    example: '<h1>Hello</h1>',
    description: 'HTML content of the email',
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    example: 'Hello, this is a test email',
    description: 'Plain text content of the email',
  })
  @IsOptional()
  @IsString()
  text?: string;
}

export class SendBulkEmailDto {
  @ApiProperty({
    example: ['user1@example.com', 'user2@example.com'],
    description: 'List of recipient email addresses',
  })
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @ApiProperty({ example: 'Annonce importante' })
  @IsString()
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;
}

export class TestEmailDto {
  @ApiProperty({
    example: 'admin@dna.tn',
    description: 'Email address to send test email to',
  })
  @IsEmail()
  to: string;
}
