import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
} from './schemas/notification-preference.schema';
import {
  NotificationTemplate,
  NotificationTemplateDocument,
} from './schemas/notification-template.schema';
import { Referee, RefereeDocument } from '../referees/schemas/referee.schema';
import {
  CreateNotificationDto,
  UpdateNotificationPreferencesDto,
  GetNotificationsQueryDto,
  SendGroupNotificationDto,
  CreateNotificationTemplateDto,
} from './dto';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from './enums';
import { WhatsAppService } from './services/whatsapp.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../email/email.service';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationPreference.name)
    private preferenceModel: Model<NotificationPreferenceDocument>,
    @InjectModel(NotificationTemplate.name)
    private templateModel: Model<NotificationTemplateDocument>,
    @InjectModel(Referee.name)
    private refereeModel: Model<RefereeDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private whatsappService: WhatsAppService,
    private notificationsGateway: NotificationsGateway,
    private emailService: EmailService,
  ) {}

  // ========== CORE NOTIFICATION METHODS ==========

  /**
   * Create and send a notification
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    // Get user preferences
    const preferences = await this.getOrCreatePreferences(dto.userId);

    // Determine channels based on preferences and request
    const channels = dto.channels || [NotificationChannel.IN_APP];
    const activeChannels = this.filterChannelsByPreferences(
      channels,
      preferences,
    );

    // Create notification
    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(dto.userId),
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: this.convertDataToObjectIds(dto.data),
      channels: activeChannels,
      priority: dto.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.PENDING,
    });

    // Send via each channel
    await this.sendViaChannels(notification, preferences);

    return notification;
  }

  /**
   * Send notification to a specific user (helper method)
   * Accepts either individual parameters or an object
   */
  async notify(
    params: CreateNotificationDto | string,
    type?: NotificationType,
    title?: string,
    message?: string,
    data?: any,
    options?: {
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
    },
  ): Promise<Notification> {
    // Handle object parameter format
    if (typeof params === 'object') {
      return this.create(params);
    }

    // Handle individual parameters format
    return this.create({
      userId: params,
      type: type!,
      title: title!,
      message: message!,
      data,
      channels: options?.channels || [
        NotificationChannel.IN_APP,
        NotificationChannel.WHATSAPP,
      ],
      priority: options?.priority,
    });
  }

  /**
   * Send notification via all specified channels
   */
  private async sendViaChannels(
    notification: NotificationDocument,
    preferences: NotificationPreference,
  ): Promise<void> {
    const updates: any = { status: NotificationStatus.SENT };

    // In-App notification via WebSocket
    if (notification.channels.includes(NotificationChannel.IN_APP)) {
      try {
        this.notificationsGateway.sendToUser(notification.userId.toString(), {
          id: notification._id.toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
        });
        updates['deliveryStatus.inApp.sent'] = true;
        updates['deliveryStatus.inApp.sentAt'] = new Date();
      } catch (error) {
        updates['deliveryStatus.inApp.error'] = error.message;
      }
    }

    // WhatsApp notification
    if (notification.channels.includes(NotificationChannel.WHATSAPP)) {
      try {
        // Get phone from preferences override OR from user profile
        let phone = preferences.whatsappNumber;

        if (!phone) {
          // Fallback to user's phone from profile
          const user = await this.userModel
            .findById(notification.userId)
            .exec();
          phone = user?.phoneNumber;
        }

        if (phone) {
          const result = await this.whatsappService.sendMessage(
            phone,
            this.formatWhatsAppMessage(notification),
          );
          updates['deliveryStatus.whatsapp.sent'] = result.success;
          updates['deliveryStatus.whatsapp.sentAt'] = new Date();
          updates['deliveryStatus.whatsapp.externalId'] = result.messageId;
          if (!result.success) {
            updates['deliveryStatus.whatsapp.error'] = result.error;
          }
        } else {
          this.logger.warn(
            `No phone number found for user ${notification.userId.toString()}`,
          );
        }
      } catch (error) {
        updates['deliveryStatus.whatsapp.error'] = error.message;
        this.logger.error(
          `Failed to send WhatsApp notification: ${error.message}`,
        );
      }
    }

    // Email notification
    if (notification.channels.includes(NotificationChannel.EMAIL)) {
      try {
        // Get email from preferences override OR from user profile
        let email = preferences.emailAddress;

        if (!email) {
          // Fallback to user's email from profile
          const user = await this.userModel
            .findById(notification.userId)
            .exec();
          email = user?.email;
        }

        if (email) {
          const result = await this.emailService.sendNotificationEmail({
            email,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            actionUrl: notification.data?.actionUrl as string,
            actionLabel: notification.data?.actionLabel as string,
          });
          updates['deliveryStatus.email.sent'] = result.success;
          updates['deliveryStatus.email.sentAt'] = new Date();
          if (!result.success) {
            updates['deliveryStatus.email.error'] = result.error;
          }
        } else {
          this.logger.warn(
            `No email address found for user ${notification.userId.toString()}`,
          );
        }
      } catch (error) {
        updates['deliveryStatus.email.error'] = error.message;
        this.logger.error(
          `Failed to send email notification: ${error.message}`,
        );
      }
    }

    await this.notificationModel.findByIdAndUpdate(notification._id, updates);
  }

  /**
   * Format message for WhatsApp
   */
  private formatWhatsAppMessage(notification: Notification): string {
    const priorityEmoji = {
      [NotificationPriority.LOW]: '',
      [NotificationPriority.NORMAL]: '',
      [NotificationPriority.HIGH]: '⚠️ ',
      [NotificationPriority.URGENT]: '🚨 ',
    };

    const typeEmoji = {
      [NotificationType.DESIGNATION_ASSIGNED]: '⚽',
      [NotificationType.CONVOCATION_INVITED]: '📅',
      [NotificationType.MATCH_REMINDER]: '⏰',
      [NotificationType.SEMINAR_REMINDER]: '⏰',
      [NotificationType.PAYMENT_VALIDATED]: '💰',
      [NotificationType.ANNOUNCEMENT]: '📢',
    };

    const emoji = typeEmoji[notification.type] || '📬';
    const priority = priorityEmoji[notification.priority] || '';

    return `${priority}${emoji} *${notification.title}*\n\n${notification.message}\n\n_DNA - Direction Nationale d'Arbitrage_`;
  }

  // ========== USER NOTIFICATION METHODS ==========

  /**
   * Get notifications for a user with pagination
   */
  async getMyNotifications(
    userId: string,
    query: GetNotificationsQueryDto,
  ): Promise<PaginatedNotifications> {
    const { page = 1, limit = 20, unreadOnly, type } = query;
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) filter.read = false;
    if (type) filter.type = type;

    const [data, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        read: false,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      {
        read: true,
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<{ deleted: boolean }> {
    const result = await this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (!result) {
      throw new NotFoundException('Notification non trouvée');
    }

    return { deleted: true };
  }

  // ========== PREFERENCES METHODS ==========

  /**
   * Get user preferences (or create defaults with user's phone/email)
   */
  async getOrCreatePreferences(
    userId: string,
  ): Promise<NotificationPreference> {
    let preferences = await this.preferenceModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!preferences) {
      // Get user's phone and email to populate preferences
      const user = await this.userModel.findById(userId).exec();

      preferences = await this.preferenceModel.create({
        userId: new Types.ObjectId(userId),
        whatsappNumber: user?.phoneNumber || undefined,
        emailAddress: user?.email || undefined,
        channels: {
          inApp: true,
          whatsapp: !!user?.phoneNumber, // Enable WhatsApp if phone exists
          email: !!user?.email, // Enable email if email exists
        },
      });
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    const preferences = await this.preferenceModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: dto },
      { new: true, upsert: true },
    );

    return preferences;
  }

  // ========== GROUP NOTIFICATIONS (ADMIN) ==========

  /**
   * Send group notification to multiple users
   */
  async sendGroupNotification(
    dto: SendGroupNotificationDto,
    _createdBy: string,
  ): Promise<{ sent: number; failed: number }> {
    // Get users based on filters
    const userIds = await this.getUserIdsByFilters(dto);

    let sent = 0;
    let failed = 0;

    const channels = dto.channels || [NotificationChannel.IN_APP];
    if (dto.sendWhatsApp !== false) {
      channels.push(NotificationChannel.WHATSAPP);
    }

    for (const userId of userIds) {
      try {
        await this.create({
          userId: userId.toString(),
          type: NotificationType.ANNOUNCEMENT,
          title: dto.title,
          message: dto.message,
          channels,
          priority: dto.priority || NotificationPriority.NORMAL,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Get user IDs based on filters (regions, leagues, categories)
   */
  private async getUserIdsByFilters(
    dto: SendGroupNotificationDto,
  ): Promise<Types.ObjectId[]> {
    const filter: any = {};

    // Filter by regions
    if (dto.regions && dto.regions.length > 0) {
      filter.region = { $in: dto.regions };
    }

    // Filter by leagues
    if (dto.leagues && dto.leagues.length > 0) {
      filter.league = { $in: dto.leagues };
    }

    // Filter by categories
    if (dto.categories && dto.categories.length > 0) {
      filter.category = { $in: dto.categories };
    }

    // If no filters, get all active referees
    if (Object.keys(filter).length === 0) {
      filter.isAvailable = true; // Only active referees
    }

    // Get referees matching filters and return their userIds
    const referees = await this.refereeModel
      .find(filter)
      .select('userId')
      .lean()
      .exec();

    return referees.map((r) => r.userId);
  }

  // ========== TEMPLATE METHODS ==========

  /**
   * Create notification template
   */
  async createTemplate(
    dto: CreateNotificationTemplateDto,
    createdBy: string,
  ): Promise<NotificationTemplate> {
    return this.templateModel.create({
      ...dto,
      createdBy: new Types.ObjectId(createdBy),
    });
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<NotificationTemplate[]> {
    return this.templateModel.find({ isActive: true }).exec();
  }

  /**
   * Render template with variables
   */
  async renderTemplate(
    code: string,
    variables: Record<string, string>,
  ): Promise<{ title: string; message: string; whatsapp?: string }> {
    const template = await this.templateModel.findOne({ code, isActive: true });
    if (!template) {
      throw new NotFoundException(`Template ${code} non trouvé`);
    }

    const render = (text: string): string => {
      let result = text;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      return result;
    };

    return {
      title: render(template.titleTemplate),
      message: render(template.messageTemplate),
      whatsapp: template.whatsappTemplate
        ? render(template.whatsappTemplate)
        : undefined,
    };
  }

  // ========== SCHEDULER HELPER METHODS ==========

  /**
   * Check if a similar notification was recently sent
   */
  async hasRecentNotification(
    userId: string,
    type: NotificationType,
    entityId: string,
    hours: number,
  ): Promise<boolean> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const existing = await this.notificationModel.findOne({
      userId: new Types.ObjectId(userId),
      type,
      $or: [
        { 'data.matchId': new Types.ObjectId(entityId) },
        { 'data.convocationId': new Types.ObjectId(entityId) },
      ],
      createdAt: { $gte: since },
    });

    return !!existing;
  }

  /**
   * Cleanup expired notifications (TTL index backup)
   */
  async cleanupExpiredNotifications(): Promise<{ deletedCount: number }> {
    const result = await this.notificationModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return { deletedCount: result.deletedCount };
  }

  // ========== HELPER METHODS ==========

  private filterChannelsByPreferences(
    channels: NotificationChannel[],
    preferences: NotificationPreference,
  ): NotificationChannel[] {
    return channels.filter((channel) => {
      switch (channel) {
        case NotificationChannel.IN_APP:
          return preferences.channels?.inApp !== false;
        case NotificationChannel.WHATSAPP:
          return preferences.channels?.whatsapp !== false;
        case NotificationChannel.EMAIL:
          return preferences.channels?.email === true;
        default:
          return true;
      }
    });
  }

  private convertDataToObjectIds(data?: any): any {
    if (!data) return {};

    const converted: any = {};
    const idFields = [
      'matchId',
      'convocationId',
      'refereeId',
      'reportId',
      'paymentId',
      'designationId',
      'availabilityId',
    ];

    for (const field of idFields) {
      if (data[field]) {
        converted[field] = new Types.ObjectId(data[field]);
      }
    }

    return converted;
  }

  // ========== READY-TO-USE NOTIFICATION HELPERS ==========
  // Ces méthodes respectent les préférences utilisateur (IN_APP, WHATSAPP, EMAIL)

  /**
   * Notifier un arbitre d'une nouvelle désignation
   * À appeler après validation d'une désignation
   * Respecte les préférences utilisateur pour les canaux
   */
  async notifyDesignation(
    userId: string,
    phone: string | null,
    data: {
      refereeName: string;
      team1: string;
      team2: string;
      date: string;
      time: string;
      venue: string;
      role: string;
      matchId?: string;
      designationId?: string;
    },
  ): Promise<Notification> {
    // Get user preferences to determine channels
    const preferences = await this.getOrCreatePreferences(userId);

    // Build channels list based on what's available
    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (phone && preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    // Create notification - filterChannelsByPreferences will validate
    return this.create({
      userId,
      type: NotificationType.DESIGNATION_ASSIGNED,
      title: 'Nouvelle Désignation',
      message: `Vous êtes désigné(e) comme ${data.role} pour ${data.team1} vs ${data.team2} le ${data.date} à ${data.time}.`,
      data: {
        matchId: data.matchId,
        designationId: data.designationId,
        actionUrl: `${process.env.FRONTEND_URL}/designations/${data.designationId}`,
        actionLabel: 'Voir la désignation',
      },
      channels: requestedChannels,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notifier un arbitre d'une convocation (séminaire, réunion, etc.)
   * À appeler après création d'une convocation
   */
  async notifyConvocation(
    userId: string,
    phone: string | null,
    data: {
      refereeName: string;
      eventType: string;
      title: string;
      date: string;
      time: string;
      venue: string;
      convocationId?: string;
    },
  ): Promise<Notification> {
    // Get user preferences
    const preferences = await this.getOrCreatePreferences(userId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (phone && preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.CONVOCATION_INVITED,
      title: `Convocation - ${data.eventType}`,
      message: `Vous êtes convoqué(e) pour "${data.title}" le ${data.date} à ${data.time} à ${data.venue}.`,
      data: {
        convocationId: data.convocationId,
        actionUrl: `${process.env.FRONTEND_URL}/convocations/${data.convocationId}`,
        actionLabel: 'Voir la convocation',
      },
      channels: requestedChannels,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notifier un arbitre d'un rappel de match
   * Appelé automatiquement par le scheduler
   */
  async notifyMatchReminder(
    userId: string,
    phone: string | null,
    data: {
      refereeName: string;
      team1: string;
      team2: string;
      date: string;
      time: string;
      venue: string;
      matchId?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(userId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (phone && preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.MATCH_REMINDER,
      title: 'Rappel Match',
      message: `N'oubliez pas votre match ${data.team1} vs ${data.team2} demain à ${data.time}.`,
      data: {
        matchId: data.matchId,
        actionUrl: `${process.env.FRONTEND_URL}/matches/${data.matchId}`,
        actionLabel: 'Voir le match',
      },
      channels: requestedChannels,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notifier un arbitre d'un rappel de séminaire/convocation
   * Appelé automatiquement par le scheduler
   */
  async notifySeminarReminder(
    userId: string,
    phone: string | null,
    data: {
      refereeName: string;
      title: string;
      date: string;
      time: string;
      venue: string;
      convocationId?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(userId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (phone && preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.SEMINAR_REMINDER,
      title: 'Rappel Séminaire',
      message: `N'oubliez pas le séminaire "${data.title}" le ${data.date} à ${data.time}.`,
      data: {
        convocationId: data.convocationId,
        actionUrl: `${process.env.FRONTEND_URL}/convocations/${data.convocationId}`,
        actionLabel: 'Voir le séminaire',
      },
      channels: requestedChannels,
      priority: NotificationPriority.NORMAL,
    });
  }

  /**
   * Notifier un arbitre de la validation de son paiement
   * À appeler après validation d'un bilan de paiement
   */
  async notifyPaymentValidated(
    userId: string,
    phone: string | null,
    data: {
      refereeName: string;
      amount: number;
      period: string;
      matchCount: number;
      paymentId?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(userId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (phone && preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.PAYMENT_VALIDATED,
      title: 'Bilan Validé',
      message: `Votre bilan pour ${data.period} a été validé : ${data.matchCount} matchs pour un total de ${data.amount} TND.`,
      data: {
        paymentId: data.paymentId,
        actionUrl: `${process.env.FRONTEND_URL}/payments/${data.paymentId}`,
        actionLabel: 'Voir le bilan',
      },
      channels: requestedChannels,
      priority: NotificationPriority.NORMAL,
    });
  }

  /**
   * Notifier le CRA d'une indisponibilité/excuse d'un arbitre
   * À appeler après qu'un arbitre signale une indisponibilité
   */
  async notifyExcuseToCRA(
    craUserId: string,
    craPhone: string | null,
    data: {
      craName: string;
      refereeName: string;
      refereeMatricule: string;
      type: string;
      reason: string;
      dateFrom: string;
      dateTo: string;
      availabilityId?: string;
      refereeId?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(craUserId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (craPhone && preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId: craUserId,
      type: NotificationType.EXCUSE_RECEIVED,
      title: 'Indisponibilité Signalée',
      message: `L'arbitre ${data.refereeName} (${data.refereeMatricule}) a signalé une indisponibilité : ${data.type} du ${data.dateFrom} au ${data.dateTo}.`,
      data: {
        availabilityId: data.availabilityId,
        refereeId: data.refereeId,
        actionUrl: `${process.env.FRONTEND_URL}/availabilities/${data.availabilityId}`,
        actionLabel: 'Voir la demande',
      },
      channels: requestedChannels,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notifier un arbitre d'un nouveau rapport d'inspection
   * À appeler après soumission d'un rapport par un inspecteur
   */
  async notifyInspectorReport(
    userId: string,
    data: {
      matchInfo: string;
      inspectorName: string;
      reportId?: string;
      matchId?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(userId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.INSPECTOR_REPORT,
      title: "Nouveau Rapport d'Inspection",
      message: `Un rapport d'inspection a été soumis pour le match ${data.matchInfo} par ${data.inspectorName}.`,
      data: {
        reportId: data.reportId,
        matchId: data.matchId,
        actionUrl: `${process.env.FRONTEND_URL}/reports/${data.reportId}`,
        actionLabel: 'Voir le rapport',
      },
      channels: requestedChannels,
      priority: NotificationPriority.NORMAL,
    });
  }

  /**
   * Notifier d'un changement de catégorie d'arbitre
   * À appeler après promotion/rétrogradation
   */
  async notifyCategoryChange(
    userId: string,
    data: {
      oldCategory: string;
      newCategory: string;
      reason?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(userId);
    const isPromotion = this.isCategoryPromotion(
      data.oldCategory,
      data.newCategory,
    );
    const title = isPromotion
      ? 'Promotion de Catégorie'
      : 'Changement de Catégorie';
    const emoji = isPromotion ? '🎉' : '📋';

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.CATEGORY_CHANGE,
      title,
      message: `${emoji} Votre catégorie a été modifiée de ${data.oldCategory} à ${data.newCategory}.${data.reason ? ` Motif: ${data.reason}` : ''}`,
      data: {
        oldCategory: data.oldCategory,
        newCategory: data.newCategory,
      },
      channels: requestedChannels,
      priority: isPromotion
        ? NotificationPriority.HIGH
        : NotificationPriority.NORMAL,
    });
  }

  /**
   * Envoyer une annonce à tous les arbitres
   * À appeler depuis l'admin pour communications générales
   */
  async notifyAnnouncement(
    userId: string,
    data: {
      title: string;
      message: string;
      priority?: NotificationPriority;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(userId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.ANNOUNCEMENT,
      title: data.title,
      message: data.message,
      channels: requestedChannels,
      priority: data.priority || NotificationPriority.NORMAL,
    });
  }

  /**
   * Helper: Vérifier si c'est une promotion de catégorie
   */
  private isCategoryPromotion(oldCat: string, newCat: string): boolean {
    const categoryOrder = ['C2', 'C1', 'B', 'A', 'ELITE', 'FIFA'];
    const oldIndex = categoryOrder.indexOf(oldCat);
    const newIndex = categoryOrder.indexOf(newCat);
    return newIndex > oldIndex;
  }

  /**
   * Notifier les arbitres d'une nouvelle ressource de formation
   * À appeler après création/publication d'une ressource
   */
  async notifyTrainingResource(
    userId: string,
    phone: string | null,
    data: {
      resourceId: string;
      title: string;
      type: string;
      description?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(userId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (phone && preferences.channels?.whatsapp !== false) {
      requestedChannels.push(NotificationChannel.WHATSAPP);
    }

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId,
      type: NotificationType.TRAINING_RESOURCE_NEW,
      title: '📚 Nouvelle ressource de formation',
      message: `Une nouvelle ressource "${data.title}" (${data.type}) est disponible.${data.description ? ` ${data.description}` : ''}`,
      data: {
        resourceId: data.resourceId,
        actionUrl: `${process.env.FRONTEND_URL}/training-resources/${data.resourceId}`,
        actionLabel: 'Consulter la ressource',
      },
      channels: requestedChannels,
      priority: NotificationPriority.NORMAL,
    });
  }

  /**
   * Notifier les admins DNA quand un rapport CDC (Commissaire) est soumis
   * À appeler après soumission d'un rapport par un inspecteur/commissaire
   * User Story: Admin DNA notifié dès qu'un rapport CDC est transmis
   */
  async notifyInspectorReportToAdmin(
    adminUserId: string,
    data: {
      inspectorName: string;
      matchInfo: string;
      refereeName: string;
      reportId?: string;
      matchId?: string;
    },
  ): Promise<Notification> {
    const preferences = await this.getOrCreatePreferences(adminUserId);

    const requestedChannels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
    ];

    if (preferences.channels?.email === true) {
      requestedChannels.push(NotificationChannel.EMAIL);
    }

    return this.create({
      userId: adminUserId,
      type: NotificationType.INSPECTOR_REPORT_SUBMITTED,
      title: '📋 Nouveau rapport CDC reçu',
      message: `${data.inspectorName} a soumis un rapport d'inspection pour ${data.refereeName} (${data.matchInfo}).`,
      data: {
        reportId: data.reportId,
        matchId: data.matchId,
        actionUrl: `${process.env.FRONTEND_URL}/inspector-reports/${data.reportId}`,
        actionLabel: 'Consulter le rapport',
      },
      channels: requestedChannels,
      priority: NotificationPriority.NORMAL,
    });
  }
}
