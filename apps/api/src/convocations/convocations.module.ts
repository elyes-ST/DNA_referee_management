import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConvocationsService } from './convocations.service';
import { ConvocationsController } from './convocations.controller';
import { Convocation, ConvocationSchema } from './schemas/convocation.schema';
import { Referee, RefereeSchema } from '../referees/schemas/referee.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Convocation.name, schema: ConvocationSchema },
      { name: Referee.name, schema: RefereeSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [ConvocationsController],
  providers: [ConvocationsService],
  exports: [ConvocationsService],
})
export class ConvocationsModule {}
