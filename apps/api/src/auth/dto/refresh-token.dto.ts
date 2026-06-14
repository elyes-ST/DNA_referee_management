import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWY...',
    description:
      'Optional - Refresh token is now read from HttpOnly cookie automatically. Body is for backwards compatibility only.',
  })
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
