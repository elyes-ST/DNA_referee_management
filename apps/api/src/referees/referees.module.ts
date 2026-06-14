import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RefereesService } from './referees.service';
import { RefereesController } from './referees.controller';
import { Referee, RefereeSchema } from './schemas/referee.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ExcelService } from '../common/services';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referee.name, schema: RefereeSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [RefereesController],
  providers: [RefereesService, ExcelService],
  exports: [RefereesService],
})
export class RefereesModule {}
