import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  Optional,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../enums';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

// Type interfaces for the scheduler
interface MatchDocument {
  _id: any;
  matchNumber?: string;
  homeTeam?: string;
  awayTeam?: string;
  date?: Date;
  venue?: string;
  competition?: string;
  status?: string;
}

interface DesignationDocument {
  _id: any;
  matchId?: any;
  refereeId?: any;
  position?: string;
  status?: string;
}

interface ConvocationDocument {
  _id: any;
  title?: string;
  type?: string;
  date?: Date;
  location?: string;
  invitedReferees?: any[];
  status?: string;
}

interface UserDocument {
  _id: any;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);
  private readonly matchReminderHours: number;
  private readonly seminarReminderHours: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Optional()
    @InjectModel('Match')
    private readonly matchModel: Model<MatchDocument>,
    @Optional()
    @InjectModel('Designation')
    private readonly designationModel: Model<DesignationDocument>,
    @Optional()
    @InjectModel('Convocation')
    private readonly convocationModel: Model<ConvocationDocument>,
    @Optional()
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
    @Optional()
    @InjectModel('Referee')
    private readonly refereeModel: Model<any>,
  ) {
    // Configuration des délais de rappel (en heures)
    this.matchReminderHours = this.configService.get<number>(
      'MATCH_REMINDER_HOURS',
      24,
    );
    this.seminarReminderHours = this.configService.get<number>(
      'SEMINAR_REMINDER_HOURS',
      48,
    );
  }

  /**
   * Vérifier et envoyer les rappels de matchs toutes les heures
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendMatchReminders() {
    if (!this.matchModel || !this.designationModel) {
      this.logger.warn(
        'Modèles Match/Designation non disponibles, rappels désactivés',
      );
      return;
    }

    this.logger.log('Vérification des rappels de matchs...');

    try {
      const now = new Date();
      const reminderThreshold = new Date(
        now.getTime() + this.matchReminderHours * 60 * 60 * 1000,
      );

      // Trouver les matchs dans la fenêtre de rappel
      const upcomingMatches = await this.matchModel.find({
        date: {
          $gt: now,
          $lte: reminderThreshold,
        },
        status: 'SCHEDULED',
      });

      this.logger.log(`${upcomingMatches.length} matchs trouvés pour rappel`);

      for (const match of upcomingMatches) {
        await this.sendMatchReminderNotifications(match);
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'envoi des rappels de matchs:", error);
    }
  }

  /**
   * Envoyer les rappels pour un match spécifique
   */
  private async sendMatchReminderNotifications(match: MatchDocument) {
    if (!match.date) return;

    // Récupérer les désignations pour ce match
    const designations = await this.designationModel.find({
      matchId: match._id,
      status: 'VALIDATED',
    });

    this.logger.log(
      `${designations.length} désignations VALIDATED trouvées pour le match ${match.matchNumber}`,
    );

    const matchDate = new Date(match.date);
    const hoursUntilMatch = Math.round(
      (matchDate.getTime() - Date.now()) / (1000 * 60 * 60),
    );

    for (const designation of designations) {
      const referees = (designation as any).referees || [];
      this.logger.log(
        `Traitement de ${referees.length} arbitres pour la désignation`,
      );

      // Iterate through all referees in this designation
      for (const refAssignment of referees) {
        // Query each referee separately with userId populated (same as designation service)
        const referee = await this.refereeModel
          .findById(refAssignment.refereeId)
          .populate('userId');

        if (!referee) {
          this.logger.warn(`Referee ${refAssignment.refereeId} not found`);
          continue;
        }

        if (!referee.userId) {
          this.logger.warn(
            `Referee ${referee._id} has no userId - referees need to be linked to users in database`,
          );
          continue;
        }

        // Get the user from the populated userId (same as designation service)
        const userIdField = referee.userId;
        const userId = userIdField._id?.toString() || userIdField.toString();

        if (typeof userIdField === 'string') {
          this.logger.warn(`User not populated for referee ${referee._id}`);
          continue;
        }

        // Vérifier si un rappel a déjà été envoyé récemment
        const alreadySent =
          await this.notificationsService.hasRecentNotification(
            userId,
            NotificationType.MATCH_REMINDER,
            match._id.toString(),
            6, // Heures
          );

        if (alreadySent) {
          this.logger.log(
            `Rappel déjà envoyé à ${userIdField.firstName} ${userIdField.lastName}`,
          );
          continue;
        }

        // Créer la notification de rappel
        await this.notificationsService.notify({
          userId: userId,
          type: NotificationType.MATCH_REMINDER,
          title: `⏰ Rappel: Match dans ${hoursUntilMatch}h`,
          message: `Rappel: Vous êtes désigné pour le match ${match.homeTeam || 'Équipe A'} - ${match.awayTeam || 'Équipe B'} prévu dans ${hoursUntilMatch} heures au ${(match as any).stadium || 'lieu non défini'}.`,
          priority: NotificationPriority.HIGH,
          channels: [
            NotificationChannel.IN_APP,
            NotificationChannel.WHATSAPP,
            NotificationChannel.EMAIL,
          ],
          data: {
            matchId: match._id.toString(),
            matchNumber: match.matchNumber || '',
            homeTeam: match.homeTeam || '',
            awayTeam: match.awayTeam || '',
            date: match.date.toISOString(),
            venue: (match as any).stadium || '',
            role: refAssignment.role || '',
          },
        });

        this.logger.log(
          `Rappel envoyé à ${userIdField.firstName} ${userIdField.lastName} pour le match ${match.matchNumber}`,
        );
      }
    }
  }

  /**
   * Vérifier et envoyer les rappels de séminaires/formations toutes les 6 heures
   */
  @Cron('0 */6 * * *')
  async sendConvocationReminders() {
    if (!this.convocationModel) {
      this.logger.warn('Modèle Convocation non disponible, rappels désactivés');
      return;
    }

    this.logger.log('Vérification des rappels de convocations...');

    try {
      const now = new Date();
      const reminderThreshold = new Date(
        now.getTime() + this.seminarReminderHours * 60 * 60 * 1000,
      );

      // Trouver les convocations à venir
      const upcomingConvocations = await this.convocationModel.find({
        date: {
          $gt: now,
          $lte: reminderThreshold,
        },
        status: { $ne: 'cancelled' },
      });

      this.logger.log(
        `${upcomingConvocations.length} convocations trouvées pour rappel`,
      );

      for (const convocation of upcomingConvocations) {
        await this.sendConvocationReminderNotifications(convocation);
      }
    } catch (error) {
      this.logger.error(
        "Erreur lors de l'envoi des rappels de convocations:",
        error,
      );
    }
  }

  /**
   * Envoyer les rappels pour une convocation spécifique
   */
  private async sendConvocationReminderNotifications(
    convocation: ConvocationDocument,
  ) {
    if (!convocation.date) return;

    const invitedReferees = convocation.invitedReferees || [];
    const convocationDate = new Date(convocation.date);
    const hoursUntilEvent = Math.round(
      (convocationDate.getTime() - Date.now()) / (1000 * 60 * 60),
    );

    for (const invitee of invitedReferees) {
      const refereeId =
        typeof invitee === 'string' ? invitee : invitee.refereeId;
      if (!refereeId) continue;

      // Query referee with userId populated (same pattern as match reminders)
      const referee = await this.refereeModel
        .findById(refereeId)
        .populate('userId');

      if (!referee) {
        this.logger.warn(`Referee ${refereeId} not found for convocation`);
        continue;
      }

      if (!referee.userId) {
        this.logger.warn(
          `Referee ${referee._id} has no userId - referees need to be linked to users in database`,
        );
        continue;
      }

      // Get the user from the populated userId
      const userIdField = referee.userId;
      const userId = userIdField._id?.toString() || userIdField.toString();

      if (typeof userIdField === 'string') {
        this.logger.warn(`User not populated for referee ${referee._id}`);
        continue;
      }

      // Vérifier si un rappel a déjà été envoyé
      const alreadySent = await this.notificationsService.hasRecentNotification(
        userId,
        NotificationType.CONVOCATION_REMINDER,
        convocation._id.toString(),
        12, // Heures
      );

      if (alreadySent) {
        this.logger.log(
          `Rappel déjà envoyé à ${userIdField.firstName} ${userIdField.lastName}`,
        );
        continue;
      }

      // Créer la notification de rappel
      await this.notificationsService.notify({
        userId: userId,
        type: NotificationType.CONVOCATION_REMINDER,
        title: `⏰ Rappel: ${convocation.type || 'Événement'} dans ${hoursUntilEvent}h`,
        message: `Rappel: Vous êtes convoqué pour "${convocation.title || 'Événement'}" prévu dans ${hoursUntilEvent} heures à ${convocation.location || 'lieu non défini'}.`,
        priority: NotificationPriority.HIGH,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.WHATSAPP,
          NotificationChannel.EMAIL,
        ],
        data: {
          convocationId: convocation._id.toString(),
          title: convocation.title || '',
          type: convocation.type || '',
          date: convocation.date.toISOString(),
          location: convocation.location || '',
        },
      });

      this.logger.log(
        `Rappel de convocation envoyé à ${userIdField.firstName} ${userIdField.lastName} pour "${convocation.title}"`,
      );
    }
  }

  /**
   * Nettoyer les anciennes notifications tous les jours à 3h du matin
   */
  @Cron('0 3 * * *')
  async cleanupOldNotifications() {
    this.logger.log('Nettoyage des anciennes notifications...');

    try {
      const result =
        await this.notificationsService.cleanupExpiredNotifications();
      this.logger.log(
        `${result.deletedCount} notifications expirées supprimées`,
      );
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des notifications:', error);
    }
  }

  /**
   * Envoyer un rapport quotidien aux admins à 8h du matin
   */
  @Cron('0 8 * * *')
  async sendDailyAdminReport() {
    if (!this.userModel || !this.matchModel || !this.designationModel) {
      this.logger.warn('Modèles non disponibles, rapport quotidien désactivé');
      return;
    }

    this.logger.log('Génération du rapport quotidien admin...');

    try {
      const stats = await this.generateDailyStats();

      // Trouver tous les admins DNA
      const admins = await this.userModel.find({
        role: 'ADMIN_DNA',
        isActive: true,
      });

      for (const admin of admins) {
        await this.notificationsService.notify({
          userId: admin._id.toString(),
          type: NotificationType.SYSTEM,
          title: '📊 Rapport quotidien',
          message: `Matchs aujourd'hui: ${stats.matchesToday} | Désignations en attente: ${stats.pendingDesignations} | Arbitres actifs: ${stats.activeReferees}`,
          priority: NotificationPriority.LOW,
          data: {
            matchesToday: String(stats.matchesToday),
            pendingDesignations: String(stats.pendingDesignations),
            activeReferees: String(stats.activeReferees),
            date: stats.date,
          } as any,
        });
      }

      this.logger.log('Rapport quotidien envoyé aux admins');
    } catch (error) {
      this.logger.error("Erreur lors de l'envoi du rapport quotidien:", error);
    }
  }

  /**
   * Générer les statistiques quotidiennes
   */
  private async generateDailyStats(): Promise<{
    matchesToday: number;
    pendingDesignations: number;
    activeReferees: number;
    date: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [matchesToday, pendingDesignations, activeReferees] =
      await Promise.all([
        this.matchModel.countDocuments({
          date: { $gte: today, $lt: tomorrow },
        }),
        this.designationModel.countDocuments({ status: 'SUBMITTED' }),
        this.userModel.countDocuments({
          role: 'ARBITRE',
          isActive: true,
        }),
      ]);

    return {
      matchesToday,
      pendingDesignations,
      activeReferees,
      date: today.toISOString().split('T')[0],
    };
  }
}
