import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to set refresh token as HttpOnly cookie
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth', // Only sent to auth endpoints
    });
  }

  /**
   * Helper to clear refresh token cookie
   */
  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      path: '/api/auth',
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user and return JWT access token (15min). Refresh token (7d) is set as HttpOnly cookie for security. Access token for API requests, refresh token cookie is automatically sent with /auth/* requests.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: {
        summary: 'Admin Login',
        value: {
          email: 'admin@dna.tn',
          password: 'Admin123!',
        },
      },
      user: {
        summary: 'Regular User Login',
        value: {
          email: 'user@dna.tn',
          password: 'User123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Login successful. Access token in body, refresh token in HttpOnly cookie (Set-Cookie header)',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'admin@dna.tn',
          role: 'ADMIN',
        },
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'refresh_token HttpOnly cookie (7 days, path=/api/auth)',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(res, result.refresh_token);

    // Return access token in body (refresh token is in cookie)
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Get new access token using refresh token from HttpOnly cookie (preferred) or request body (backwards compatible). Old refresh token is invalidated (token rotation). New refresh token is set as HttpOnly cookie.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    required: false,
    description:
      'Optional - refresh token is automatically read from HttpOnly cookie. Body is for backwards compatibility only.',
    examples: {
      cookie: {
        summary: 'Using HttpOnly Cookie (Recommended)',
        description:
          'No body needed - refresh token is read from cookie automatically',
        value: {},
      },
      body: {
        summary: 'Using Body (Backwards Compatible)',
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Access token refreshed. New refresh token set in HttpOnly cookie.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'New refresh_token HttpOnly cookie (token rotation)',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({
    status: 403,
    description: 'Token reuse detected - all sessions invalidated',
  })
  async refreshTokens(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshTokenDto,
  ) {
    // Get refresh token from cookie or body (for backwards compatibility)
    const refreshToken = req.cookies?.refresh_token || body.refresh_token;
    const result = await this.authService.refreshTokens(
      req.user.userId,
      refreshToken,
    );

    // Set new refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(res, result.refresh_token);

    // Return only access token in body
    return {
      access_token: result.access_token,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from current device',
    description:
      'Invalidate refresh token and clear HttpOnly cookie. Token is read from cookie (preferred) or body. Use access token in Authorization header.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    required: false,
    description:
      'Optional - refresh token is read from HttpOnly cookie automatically',
    examples: {
      cookie: {
        summary: 'Using HttpOnly Cookie (Recommended)',
        description: 'No body needed - cookie is cleared automatically',
        value: {},
      },
      body: {
        summary: 'Using Body (Backwards Compatible)',
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully, HttpOnly cookie cleared',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'Clears refresh_token cookie',
        schema: { type: 'string' },
      },
    },
  })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshTokenDto,
  ) {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refresh_token || body.refresh_token;
    const result = await this.authService.logout(req.user.userId, refreshToken);

    // Clear the refresh token cookie
    this.clearRefreshTokenCookie(res);

    return result;
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Invalidate all refresh tokens for the user. Requires access token in Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
    schema: {
      example: {
        message: 'Logged out from all devices successfully',
      },
    },
  })
  async logoutAll(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logoutAll(req.user.userId);

    // Clear the refresh token cookie
    this.clearRefreshTokenCookie(res);

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Send password reset email with token (valid for 15 minutes). In production, this sends an email.',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      default: {
        summary: 'Forgot Password Request',
        value: {
          email: 'user@dna.tn',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    schema: {
      example: {
        message: 'Password reset email sent. Token: a1b2c3d4e5f6g7h8i9j0',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description:
      'Reset user password using token from email. Token valid for 15 minutes. All sessions will be invalidated.',
  })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      default: {
        summary: 'Reset Password Request',
        value: {
          token: 'a1b2c3d4e5f6g7h8i9j0',
          newPassword: 'NewSecure@Pass123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: {
        message: 'Password reset successful',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}