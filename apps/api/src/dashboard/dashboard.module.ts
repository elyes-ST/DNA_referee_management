import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Match, MatchSchema } from '../matches/schemas/match.schema';
import {
  Designation,
  DesignationSchema,
} from '../designations/schemas/designation.schema';
import { Referee, RefereeSchema } from '../referees/schemas/referee.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import {
  Convocation,
  ConvocationSchema,
} from '../convocations/schemas/convocation.schema';
import {
  InspectorReport,
  InspectorReportSchema,
} from '../inspector-reports/schemas/inspector-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Designation.name, schema: DesignationSchema },
      { name: Referee.name, schema: RefereeSchema },
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Convocation.name, schema: ConvocationSchema },
      { name: InspectorReport.name, schema: InspectorReportSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
