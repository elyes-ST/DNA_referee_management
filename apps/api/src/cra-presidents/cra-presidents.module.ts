import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CraPresidentsService } from './cra-presidents.service';
import { CraPresidentsController } from './cra-presidents.controller';
import {
  CRAPresident,
  CRAPresidentSchema,
} from './schemas/cra-president.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CRAPresident.name, schema: CRAPresidentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CraPresidentsController],
  providers: [CraPresidentsService],
  exports: [CraPresidentsService],
})
export class CraPresidentsModule {}
