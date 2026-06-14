import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../enums';

// ========== Create Notification DTO ==========
export class NotificationDataDto {
  @IsOptional()
  @IsString()
  matchId?: string;

  @IsOptional()
  @IsString()
  convocationId?: string;

  @IsOptional()
  @IsString()
  refereeId?: string;

  @IsOptional()
  @IsString()
  reportId?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsString()
  availabilityId?: string;

  // Dynamic fields for additional data
  @IsOptional()
  @IsString()
  matchNumber?: string;

  @IsOptional()
  @IsString()
  homeTeam?: string;

  @IsOptional()
  @IsString()
  awayTeam?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  // Allow additional properties
  [key: string]: any;
}

export class CreateNotificationDto {
  @IsString()
  @ApiProperty({ description: "ID de l'utilisateur destinataire" })
  userId: string;

  @IsEnum(NotificationType)
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @IsString()
  @ApiProperty({ example: 'Nouvelle désignation' })
  title: string;

  @IsString()
  @ApiProperty({ example: 'Vous êtes désigné pour le match X vs Y' })
  message: string;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  channels?: NotificationChannel[];

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationDataDto)
  data?: NotificationDataDto;

  @IsOptional()
  @IsEnum(NotificationPriority)
  @ApiPropertyOptional({ enum: NotificationPriority })
  priority?: NotificationPriority;
}

// ========== Send Group Notification DTO ==========
export class SendGroupNotificationDto {
  @IsString()
  @ApiProperty({ example: 'Annonce importante' })
  title: string;

  @IsString()
  @ApiProperty({ example: 'Message pour tous les arbitres...' })
  message: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'Filtrer par régions',
    example: ['Tunis', 'Sfax'],
  })
  regions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'Filtrer par ligues',
    example: ['Ligue 1', 'Ligue 2'],
  })
  leagues?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'Filtrer par catégories',
    example: ['A', 'B', 'C1'],
  })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  channels?: NotificationChannel[];

  @IsOptional()
  @IsEnum(NotificationPriority)
  @ApiPropertyOptional({ enum: NotificationPriority })
  priority?: NotificationPriority;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Envoyer aussi par WhatsApp',
    default: true,
  })
  sendWhatsApp?: boolean;
}

// ========== Update Preferences DTO ==========
class ChannelPreferencesDto {
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;
}

class QuietHoursDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;
}

class TypePreferencesDto {
  @IsOptional()
  @IsBoolean()
  designation?: boolean;

  @IsOptional()
  @IsBoolean()
  convocation?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder?: boolean;

  @IsOptional()
  @IsBoolean()
  payment?: boolean;

  @IsOptional()
  @IsBoolean()
  announcement?: boolean;

  @IsOptional()
  @IsBoolean()
  availability?: boolean;
}

class ReminderTimingDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // Max 1 week
  matchHoursBefore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  seminarHoursBefore?: number;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  @ApiPropertyOptional()
  channels?: ChannelPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  @ApiPropertyOptional()
  quietHours?: QuietHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferencesDto)
  @ApiPropertyOptional()
  types?: TypePreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderTimingDto)
  @ApiPropertyOptional()
  reminderTiming?: ReminderTimingDto;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Numéro WhatsApp alternatif' })
  whatsappNumber?: string;
}

// ========== Query DTO ==========
export class GetNotificationsQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

// ========== Template DTO ==========
export class CreateNotificationTemplateDto {
  @IsString()
  @ApiProperty({ example: 'DESIGNATION_MATCH' })
  code: string;

  @IsEnum(NotificationType)
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @IsString()
  @ApiProperty({ example: 'Nouvelle désignation - {{matchName}}' })
  titleTemplate: string;

  @IsString()
  @ApiProperty({
    example: 'Vous êtes désigné pour {{team1}} vs {{team2}} le {{date}}',
  })
  messageTemplate: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '⚽ Désignation: {{team1}} vs {{team2}} - {{date}}',
  })
  whatsappTemplate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ example: ['matchName', 'team1', 'team2', 'date'] })
  variables?: string[];
}
