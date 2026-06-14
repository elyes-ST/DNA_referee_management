import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { WhatsAppService } from './services/whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '../common/enums';
import {
  GetNotificationsQueryDto,
  UpdateNotificationPreferencesDto,
  SendGroupNotificationDto,
} from './dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  // ========== USER ENDPOINTS ==========

  @Get('my')
  @ApiOperation({
    summary: 'Mes notifications',
    description: 'Récupérer mes notifications avec pagination',
  })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  getMyNotifications(
    @CurrentUser() user: any,
    @Query() query: GetNotificationsQueryDto,
  ) {
    return this.notificationsService.getMyNotifications(user.userId, query);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Nombre de non-lues',
    description: 'Récupérer le nombre de notifications non lues',
  })
  @ApiResponse({ status: 200, description: 'Nombre de notifications non lues' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Marquer comme lue',
    description: 'Marquer une notification comme lue',
  })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.userId, id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Tout marquer comme lu',
    description: 'Marquer toutes les notifications comme lues',
  })
  @ApiResponse({
    status: 200,
    description: 'Toutes les notifications marquées comme lues',
  })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer notification',
    description: 'Supprimer une notification',
  })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification supprimée' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  deleteNotification(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(user.userId, id);
  }

  // ========== PREFERENCES ENDPOINTS ==========

  @Get('preferences')
  @ApiOperation({
    summary: 'Mes préférences',
    description: 'Récupérer mes préférences de notification',
  })
  @ApiResponse({ status: 200, description: 'Préférences de notification' })
  getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getOrCreatePreferences(user.userId);
  }

  @Patch('preferences')
  @ApiOperation({
    summary: 'Modifier préférences',
    description: 'Modifier mes préférences de notification',
  })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour' })
  updatePreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.userId, dto);
  }

  // ========== ADMIN ENDPOINTS ==========

  @Post('send-group')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Envoyer notification groupée',
    description:
      'Envoyer une notification à plusieurs utilisateurs (Admin DNA uniquement)',
  })
  @ApiResponse({ status: 201, description: 'Notifications envoyées' })
  sendGroupNotification(
    @CurrentUser() user: any,
    @Body() dto: SendGroupNotificationDto,
  ) {
    return this.notificationsService.sendGroupNotification(dto, user.userId);
  }

  // ========== WHATSAPP STATUS ENDPOINT ==========

  @Get('whatsapp/status')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Statut WhatsApp',
    description: 'Vérifier le statut de la connexion WhatsApp',
  })
  @ApiResponse({ status: 200, description: 'Statut WhatsApp' })
  async getWhatsAppStatus() {
    const isEnabled = this.whatsappService.isEnabled();
    if (!isEnabled) {
      return {
        enabled: false,
        message: 'WhatsApp non configuré (variables GREENAPI manquantes)',
      };
    }

    const status = await this.whatsappService.getAccountStatus();
    return {
      enabled: true,
      authorized: status.authorized,
      details: status.statusData,
    };
  }
}
