import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface GreenApiResponse {
  idMessage?: string;
  error?: string;
}

interface CheckWhatsAppResponse {
  existsWhatsapp?: boolean;
}

interface StateInstanceResponse {
  stateInstance?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string;
  private readonly idInstance: string;
  private readonly apiToken: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.idInstance = this.configService.get<string>(
      'GREENAPI_INSTANCE_ID',
      '',
    );
    this.apiToken = this.configService.get<string>('GREENAPI_TOKEN', '');
    this.enabled = !!(this.idInstance && this.apiToken);

    if (this.enabled) {
      this.apiUrl = `https://api.green-api.com/waInstance${this.idInstance}`;
      this.logger.log('WhatsApp Service (GREEN-API) initialized');
    } else {
      this.logger.warn(
        'WhatsApp Service disabled - missing GREENAPI_INSTANCE_ID or GREENAPI_TOKEN',
      );
    }
  }

  /**
   * Check if WhatsApp service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Format phone number for WhatsApp
   * Removes spaces, dashes, and ensures country code
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, assume Tunisia and add 216
    if (cleaned.startsWith('0')) {
      cleaned = '216' + cleaned.substring(1);
    }

    // If doesn't start with country code, add 216 for Tunisia
    if (!cleaned.startsWith('216') && cleaned.length === 8) {
      cleaned = '216' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendMessage(
    phone: string,
    message: string,
  ): Promise<WhatsAppSendResult> {
    if (!this.enabled) {
      this.logger.warn('WhatsApp not enabled, skipping message');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const response = await axios.post<GreenApiResponse>(
        `${this.apiUrl}/sendMessage/${this.apiToken}`,
        {
          chatId: `${formattedPhone}@c.us`,
          message: message,
        },
        { timeout: 30000 },
      );

      if (response.data.idMessage) {
        this.logger.log(`WhatsApp message sent to ${formattedPhone}`);
        return {
          success: true,
          messageId: response.data.idMessage,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error(`WhatsApp send error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send a file/document via WhatsApp
   */
  async sendFile(
    phone: string,
    fileUrl: string,
    fileName: string,
    caption?: string,
  ): Promise<WhatsAppSendResult> {
    if (!this.enabled) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const response = await axios.post<GreenApiResponse>(
        `${this.apiUrl}/sendFileByUrl/${this.apiToken}`,
        {
          chatId: `${formattedPhone}@c.us`,
          urlFile: fileUrl,
          fileName: fileName,
          caption: caption || '',
        },
        { timeout: 30000 },
      );

      if (response.data.idMessage) {
        this.logger.log(`WhatsApp file sent to ${formattedPhone}`);
        return {
          success: true,
          messageId: response.data.idMessage,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error(`WhatsApp file send error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if a phone number is registered on WhatsApp
   */
  async checkWhatsApp(phone: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const response = await axios.post<CheckWhatsAppResponse>(
        `${this.apiUrl}/checkWhatsapp/${this.apiToken}`,
        {
          phoneNumber: formattedPhone,
        },
        { timeout: 30000 },
      );

      return response.data.existsWhatsapp === true;
    } catch (error) {
      this.logger.error(`WhatsApp check error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get account status (for health check)
   */
  async getAccountStatus(): Promise<{
    authorized: boolean;
    statusData?: any;
  }> {
    if (!this.enabled) {
      return { authorized: false };
    }

    try {
      const response = await axios.get<StateInstanceResponse>(
        `${this.apiUrl}/getStateInstance/${this.apiToken}`,
        { timeout: 30000 },
      );
      return {
        authorized: response.data.stateInstance === 'authorized',
        statusData: response.data,
      };
    } catch (error) {
      this.logger.error(`WhatsApp status check error: ${error.message}`);
      return { authorized: false };
    }
  }

  // ========== NOTIFICATION TEMPLATES ==========

  /**
   * Send designation notification
   */
  async sendDesignationNotification(
    phone: string,
    data: {
      refereeName: string;
      team1: string;
      team2: string;
      date: string;
      time: string;
      venue: string;
      role: string;
    },
  ): Promise<WhatsAppSendResult> {
    const message = `⚽ *Nouvelle Désignation*

Bonjour ${data.refereeName},

Vous êtes désigné(e) en tant que *${data.role}* pour le match :

📍 *${data.team1}* vs *${data.team2}*
📅 ${data.date} à ${data.time}
🏟️ ${data.venue}

Merci de confirmer votre disponibilité.

_DNA - Direction Nationale d'Arbitrage_`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send convocation notification
   */
  async sendConvocationNotification(
    phone: string,
    data: {
      refereeName: string;
      eventType: string;
      title: string;
      date: string;
      time: string;
      venue: string;
    },
  ): Promise<WhatsAppSendResult> {
    const message = `📅 *Convocation - ${data.eventType}*

Bonjour ${data.refereeName},

Vous êtes convoqué(e) pour :

📌 *${data.title}*
📅 ${data.date} à ${data.time}
📍 ${data.venue}

Votre présence est obligatoire.

_DNA - Direction Nationale d'Arbitrage_`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(
    phone: string,
    data: {
      refereeName: string;
      eventType: 'match' | 'seminar';
      details: string;
      dateTime: string;
    },
  ): Promise<WhatsAppSendResult> {
    const emoji = data.eventType === 'match' ? '⚽' : '📅';
    const eventLabel = data.eventType === 'match' ? 'Match' : 'Séminaire';

    const message = `⏰ *Rappel - ${eventLabel}*

Bonjour ${data.refereeName},

N'oubliez pas votre ${eventLabel.toLowerCase()} :

${emoji} ${data.details}
📅 ${data.dateTime}

_DNA - Direction Nationale d'Arbitrage_`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send payment validation notification
   */
  async sendPaymentNotification(
    phone: string,
    data: {
      refereeName: string;
      amount: number;
      period: string;
      matchCount: number;
    },
  ): Promise<WhatsAppSendResult> {
    const message = `💰 *Bilan de Paiement Validé*

Bonjour ${data.refereeName},

Votre bilan pour la période *${data.period}* a été validé :

📊 Nombre de matchs : ${data.matchCount}
💵 Montant total : ${data.amount} TND

Le paiement sera effectué selon les procédures en vigueur.

_DNA - Direction Nationale d'Arbitrage_`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send CRA excuse notification
   */
  async sendExcuseNotificationToCRA(
    phone: string,
    data: {
      craName: string;
      refereeName: string;
      refereeMatricule: string;
      type: string;
      reason: string;
      dateFrom: string;
      dateTo: string;
    },
  ): Promise<WhatsAppSendResult> {
    const message = `⚠️ *Signalement d'Indisponibilité*

Bonjour ${data.craName},

L'arbitre *${data.refereeName}* (${data.refereeMatricule}) a signalé une indisponibilité :

📋 Type : ${data.type}
📝 Motif : ${data.reason}
📅 Du ${data.dateFrom} au ${data.dateTo}

Veuillez prendre les mesures nécessaires.

_DNA - Direction Nationale d'Arbitrage_`;

    return this.sendMessage(phone, message);
  }
}
