import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InspectorReportsController } from './inspector-reports.controller';
import { InspectorReportsService } from './inspector-reports.service';
import {
  InspectorReport,
  InspectorReportSchema,
} from './schemas/inspector-report.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InspectorReport.name, schema: InspectorReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationsModule),
    UsersModule,
  ],
  controllers: [InspectorReportsController],
  providers: [InspectorReportsService],
  exports: [InspectorReportsService],
})
export class InspectorReportsModule {}
