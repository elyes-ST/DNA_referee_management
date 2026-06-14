import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentRatesController } from './payment-rates.controller';
import { PaymentRatesService } from './payment-rates.service';
import { MatchPaymentsController } from './match-payments.controller';
import { MatchPaymentsService } from './match-payments.service';
import { PaymentCalculationService } from './services/payment-calculation.service';
import { FinancialVisibilityService } from './services/financial-visibility.service';
import { RegionalPDFService } from './services/regional-pdf.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentRate, PaymentRateSchema } from './schemas/payment-rate.schema';
import {
  MatchPayment,
  MatchPaymentSchema,
} from './schemas/match-payment.schema';
import { Match, MatchSchema } from '../matches/schemas/match.schema';
import { Referee, RefereeSchema } from '../referees/schemas/referee.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PaymentRate.name, schema: PaymentRateSchema },
      { name: MatchPayment.name, schema: MatchPaymentSchema },
      { name: Match.name, schema: MatchSchema },
      { name: Referee.name, schema: RefereeSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    PaymentsController,
    PaymentRatesController,
    MatchPaymentsController,
  ],
  providers: [
    PaymentsService,
    PaymentRatesService,
    MatchPaymentsService,
    PaymentCalculationService,
    FinancialVisibilityService,
    RegionalPDFService,
  ],
  exports: [
    PaymentsService,
    PaymentCalculationService,
    FinancialVisibilityService,
    RegionalPDFService,
  ],
})
export class PaymentsModule {}
