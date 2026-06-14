import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RefereesModule } from './referees/referees.module';
import { InspectorsModule } from './inspectors/inspectors.module';
import { CraPresidentsModule } from './cra-presidents/cra-presidents.module';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';
import { ConvocationsModule } from './convocations/convocations.module';
import { PaymentsModule } from './payments/payments.module';
import { DesignationsModule } from './designations/designations.module';
import { TrainingResourcesModule } from './training-resources/training-resources.module';
import { StatisticsModule } from './statistics/statistics.module';
import { InspectorReportsModule } from './inspector-reports/inspector-reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    EmailModule, // Global module - available everywhere
    AuthModule,
    UsersModule,
    RefereesModule,
    InspectorsModule,
    CraPresidentsModule,
    TeamsModule, // Module équipes
    MatchesModule,
    ConvocationsModule,
    PaymentsModule,
    DesignationsModule,
    TrainingResourcesModule,
    StatisticsModule,
    InspectorReportsModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
