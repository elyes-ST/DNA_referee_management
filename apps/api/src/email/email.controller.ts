import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { TestEmailDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('status')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get email service status',
    description: 'Check if SMTP is configured and connected (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Email service status',
    schema: {
      example: {
        enabled: true,
        configured: true,
        provider: 'smtp.gmail.com',
      },
    },
  })
  getStatus() {
    return {
      enabled: this.emailService.isEnabled(),
      configured: this.emailService.isEnabled(),
      message: this.emailService.isEnabled()
        ? 'Email service is active'
        : 'Email service is disabled - check SMTP configuration',
    };
  }

  @Post('test')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Send test email',
    description: 'Send a test email to verify SMTP configuration (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Test email sent',
    schema: {
      example: {
        success: true,
        messageId: '<abc123@smtp.gmail.com>',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Failed to send test email' })
  async sendTestEmail(@Body() dto: TestEmailDto) {
    const result = await this.emailService.sendTestEmail(dto.to);
    return result;
  }
}
