import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Compte inactif');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token to database with hashing
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $push: { refreshTokens: hashedRefreshToken },
        $set: { lastLogin: new Date() },
      },
    );

    // Limit stored refresh tokens to prevent token bloat (keep last 5)
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: {
            $each: [],
            $slice: -5, // Keep only the last 5 refresh tokens
          },
        },
      },
    );

    return {
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new ForbiddenException('Access Denied');
    }

    // Verify refresh token against stored hashed tokens
    const refreshTokenMatches = await Promise.all(
      (user.refreshTokens || []).map((hashedToken) =>
        bcrypt.compare(refreshToken, hashedToken),
      ),
    );

    if (!refreshTokenMatches.some((match) => match)) {
      // Possible token reuse attack - invalidate all tokens
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { refreshTokens: [] } },
      );
      throw new ForbiddenException('Access Denied');
    }

    // Generate new tokens (token rotation)
    const tokens = await this.generateTokens(user);

    // Remove old refresh token and add new one
    const oldHashedTokens = user.refreshTokens || [];
    const validTokens: string[] = [];

    for (let i = 0; i < oldHashedTokens.length; i++) {
      const isMatch = await bcrypt.compare(refreshToken, oldHashedTokens[i]);
      if (!isMatch) {
        validTokens.push(oldHashedTokens[i]);
      }
    }

    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    validTokens.push(hashedRefreshToken);

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshTokens: validTokens.slice(-5) } }, // Keep last 5
    );

    return tokens;
  }

  async logout(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      return { message: 'Logged out successfully' };
    }

    // Remove the specific refresh token
    const oldHashedTokens = user.refreshTokens || [];
    const validTokens: string[] = [];

    for (const hashedToken of oldHashedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, hashedToken);
      if (!isMatch) {
        validTokens.push(hashedToken);
      }
    }

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshTokens: validTokens } },
    );

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshTokens: [] } },
    );

    return { message: 'Logged out from all devices successfully' };
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error(
        'JWT_SECRET and JWT_REFRESH_SECRET are required in environment variables',
      );
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
      } as any),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
      } as any),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      // Don't reveal if email exists or not (prevent email enumeration)
      return {
        message: 'If the email exists, a reset link has been sent',
      };
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Set token and expiration (15 minutes)
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: hashedToken,
          passwordResetExpires: resetExpires,
        },
      },
    );

    // Send password reset email
    void this.sendPasswordResetEmail(user, resetToken);

    return {
      message: 'If the email exists, a reset link has been sent',
    };
  }

  /**
   * Send password reset email (async, don't block response)
   */
  private async sendPasswordResetEmail(
    user: UserDocument,
    resetToken: string,
  ): Promise<void> {
    try {
      const result = await this.emailService.sendPasswordResetEmail(
        user.email,
        {
          firstName: user.firstName,
          lastName: user.lastName,
          resetToken,
          expiresIn: '15 minutes',
        },
      );

      if (result.success) {
        this.logger.log(`Password reset email sent to ${user.email}`);
      } else {
        this.logger.warn(
          `Failed to send password reset email to ${user.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending password reset email to ${user.email}:`,
        error,
      );
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Find users with non-expired reset tokens
    const users = await this.userModel
      .find({
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();

    // Check token against all users (prevent timing attacks)
    let matchedUser: UserDocument | null = null;
    for (const user of users) {
      if (user.passwordResetToken) {
        const isValid = await bcrypt.compare(token, user.passwordResetToken);
        if (isValid) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token, invalidate all sessions
    await this.userModel.updateOne(
      { _id: matchedUser._id },
      {
        $set: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          refreshTokens: [], // Invalidate all sessions
        },
      },
    );

    return {
      message: 'Password reset successfully',
    };
  }
}
