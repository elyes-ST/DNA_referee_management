import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { WhatsAppService } from './services/whatsapp.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';

import {
  Notification,
  NotificationSchema,
  NotificationPreference,
  NotificationPreferenceSchema,
  NotificationTemplate,
  NotificationTemplateSchema,
} from './schemas';

// Import schemas from other modules for scheduler
import { Match, MatchSchema } from '../matches/schemas/match.schema';
import {
  Designation,
  DesignationSchema,
} from '../designations/schemas/designation.schema';
import {
  Convocation,
  ConvocationSchema,
} from '../convocations/schemas/convocation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Referee, RefereeSchema } from '../referees/schemas/referee.schema';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is required in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION') || '15m',
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      // Notification schemas
      { name: Notification.name, schema: NotificationSchema },
      {
        name: NotificationPreference.name,
        schema: NotificationPreferenceSchema,
      },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      // External schemas for scheduler and group notifications
      { name: Match.name, schema: MatchSchema },
      { name: Designation.name, schema: DesignationSchema },
      { name: Convocation.name, schema: ConvocationSchema },
      { name: User.name, schema: UserSchema },
      { name: Referee.name, schema: RefereeSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    WhatsAppService,
    NotificationSchedulerService,
  ],
  exports: [NotificationsService, NotificationsGateway, WhatsAppService],
})
export class NotificationsModule {}
