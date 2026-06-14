import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrainingResourcesController } from './training-resources.controller';
import { TrainingResourcesService } from './training-resources.service';
import {
  TrainingResource,
  TrainingResourceSchema,
} from './schemas/training-resource.schema';
import { Referee, RefereeSchema } from '../referees/schemas/referee.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrainingResource.name, schema: TrainingResourceSchema },
      { name: Referee.name, schema: RefereeSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationsModule),
    UsersModule,
  ],
  controllers: [TrainingResourcesController],
  providers: [TrainingResourcesService],
  exports: [TrainingResourcesService],
})
export class TrainingResourcesModule {}
