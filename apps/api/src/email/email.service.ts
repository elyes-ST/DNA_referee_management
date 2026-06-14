import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import {
  getWelcomeEmailTemplate,
  getWelcomeEmailPlainText,
  WelcomeEmailData,
  getPasswordResetEmailTemplate,
  getPasswordResetEmailPlainText,
  PasswordResetEmailData,
} from './templates';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Mail | null = null;
  private readonly enabled: boolean;
  private readonly isDevelopment: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    this.enabled = !!(
      this.configService.get('SMTP_HOST') && this.configService.get('SMTP_USER')
    );
    this.fromName = this.configService.get('SMTP_FROM_NAME', 'DNA Arbitrage');
    this.fromEmail = this.configService.get(
      'SMTP_FROM_EMAIL',
      'noreply@dna.tn',
    );
  }

  async onModuleInit() {
    if (this.enabled) {
      await this.createTransporter();
    } else {
      this.logger.warn('Email Service disabled - missing SMTP configuration');
      if (this.isDevelopment) {
        this.logger.log('Development mode: emails will be logged to console');
      }
    }
  }

  /**
   * Create SMTP transporter with configuration
   */
  private async createTransporter(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: parseInt(this.configService.get('SMTP_PORT', '587'), 10),
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASSWORD'),
        },
        // Connection pool for better performance
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        // Timeouts
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      }) as Mail;

      // Verify connection
      await (this.transporter as any).verify();
      this.logger.log('✅ Email Service (SMTP) connected successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize SMTP transporter: ${error.message}`,
      );
      this.transporter = null;
    }
  }

  /**
   * Check if email service is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.transporter !== null;
  }

  /**
   * Send an email
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    // Development mode: log to console
    if (this.isDevelopment && !this.transporter) {
      this.logger.log('📧 [DEV MODE] Email would be sent:');
      this.logger.log(
        `  To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
      );
      this.logger.log(`  Subject: ${options.subject}`);
      this.logger.log(`  Text: ${options.text?.substring(0, 100)}...`);
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    if (!this.transporter) {
      this.logger.warn('Email not sent - SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    try {
      const result = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      this.logger.log(
        `✉️ Email sent to ${options.to} - ID: ${result.messageId}`,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
      return { success: false, error: error.message };
    }
  }

  // ========== READY-TO-USE EMAIL METHODS ==========

  /**
   * Send welcome email with credentials to new user
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
    const loginUrl =
      this.configService.get('FRONTEND_URL', 'https://dna.tn') + '/login';
    const emailData = { ...data, loginUrl };

    return this.sendEmail({
      to: data.email,
      subject: '🎉 Bienvenue sur DNA Arbitrage - Vos identifiants de connexion',
      html: getWelcomeEmailTemplate(emailData),
      text: getWelcomeEmailPlainText(emailData),
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    data: PasswordResetEmailData,
  ): Promise<EmailResult> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'https://dna.tn',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${data.resetToken}`;
    const emailData = { ...data, resetUrl };

    return this.sendEmail({
      to: email,
      subject: '🔑 Réinitialisation de votre mot de passe - DNA',
      html: getPasswordResetEmailTemplate(emailData),
      text: getPasswordResetEmailPlainText(emailData),
    });
  }

  /**
   * Send designation notification email
   */
  async sendDesignationEmail(
    email: string,
    data: {
      refereeName: string;
      team1: string;
      team2: string;
      date: string;
      time: string;
      venue: string;
      role: string;
    },
  ): Promise<EmailResult> {
    const subject = `📋 Nouvelle Désignation - ${data.team1} vs ${data.team2}`;
    const text = `
Bonjour ${data.refereeName},

Vous avez été désigné(e) pour le match suivant :

Match : ${data.team1} vs ${data.team2}
Date : ${data.date} à ${data.time}
Lieu : ${data.venue}
Rôle : ${data.role}

Connectez-vous à la plateforme pour plus de détails.

Cordialement,
L'équipe DNA
    `.trim();

    return this.sendEmail({
      to: email,
      subject,
      text,
    });
  }

  /**
   * Send payment validation email
   */
  async sendPaymentEmail(
    email: string,
    data: {
      refereeName: string;
      amount: number;
      period: string;
      matchCount: number;
    },
  ): Promise<EmailResult> {
    const subject = `💰 Bilan Validé - ${data.period}`;
    const text = `
Bonjour ${data.refereeName},

Votre bilan de paiement pour ${data.period} a été validé.

Détails :
- Nombre de matchs : ${data.matchCount}
- Montant total : ${data.amount} TND

Le paiement sera effectué selon le calendrier habituel.

Cordialement,
L'équipe DNA
    `.trim();

    return this.sendEmail({
      to: email,
      subject,
      text,
    });
  }

  /**
   * Send generic announcement email
   */
  async sendAnnouncementEmail(
    emails: string[],
    subject: string,
    message: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: emails,
      subject: `📢 ${subject}`,
      text: message,
    });
  }

  /**
   * Send notification email (for notification system)
   */
  async sendNotificationEmail(data: {
    email: string;
    title: string;
    message: string;
    type: string;
    priority: string;
    actionUrl?: string;
    actionLabel?: string;
  }): Promise<EmailResult> {
    const priorityEmoji: Record<string, string> = {
      low: '',
      normal: '',
      high: '⚠️ ',
      urgent: '🚨 ',
    };

    const typeEmoji: Record<string, string> = {
      designation_assigned: '⚽',
      convocation_invited: '📅',
      match_reminder: '⏰',
      seminar_reminder: '⏰',
      payment_validated: '💰',
      announcement: '📢',
      availability_reminder: '📋',
      report_submitted: '📝',
      category_change: '🏅',
    };

    const emoji = typeEmoji[data.type] || '📬';
    const priorityIcon = priorityEmoji[data.priority?.toLowerCase()] || '';

    const subject = `${priorityIcon}${emoji} ${data.title}`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">DNA Arbitrage</h1>
  </div>
  <div style="padding: 30px; background-color: #f8f9fa;">
    <h2 style="color: #1e3a5f; margin-top: 0;">${emoji} ${data.title}</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">${data.message}</p>
    ${
      data.actionUrl
        ? `
    <div style="text-align: center; margin-top: 25px;">
      <a href="${data.actionUrl}" 
         style="background-color: #dc3545; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 5px; font-weight: bold;">
        ${data.actionLabel || 'Voir les détails'}
      </a>
    </div>
    `
        : ''
    }
  </div>
  <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center;">
    <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} DNA - Direction Nationale d'Arbitrage</p>
  </div>
</div>
    `.trim();

    const text = `${data.title}\n\n${data.message}${data.actionUrl ? `\n\nLien: ${data.actionUrl}` : ''}\n\n-- DNA Arbitrage`;

    return this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send test email (for configuration verification)
   */
  async sendTestEmail(to: string): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: '✅ Test Email - DNA Arbitrage',
      text: `
Ceci est un email de test envoyé depuis la plateforme DNA Arbitrage.

Si vous recevez cet email, la configuration SMTP fonctionne correctement.

Date : ${new Date().toLocaleString('fr-FR')}
      `.trim(),
      html: `
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color: #1e3a5f;">✅ Test Email - DNA Arbitrage</h2>
  <p>Ceci est un email de test envoyé depuis la plateforme DNA Arbitrage.</p>
  <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
  <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
</div>
      `,
    });
  }
}
