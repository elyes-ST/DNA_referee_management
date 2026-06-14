import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InspectorsService } from './inspectors.service';
import { InspectorsController } from './inspectors.controller';
import { InspectorAssignmentsService } from './inspector-assignments.service';
import { InspectorAssignmentsController } from './inspector-assignments.controller';
import { Inspector, InspectorSchema } from './schemas/inspector.schema';
import {
  InspectorAssignment,
  InspectorAssignmentSchema,
} from './schemas/inspector-assignment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Match, MatchSchema } from '../matches/schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inspector.name, schema: InspectorSchema },
      { name: InspectorAssignment.name, schema: InspectorAssignmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [InspectorsController, InspectorAssignmentsController],
  providers: [InspectorsService, InspectorAssignmentsService],
  exports: [InspectorsService, InspectorAssignmentsService],
})
export class InspectorsModule {}
