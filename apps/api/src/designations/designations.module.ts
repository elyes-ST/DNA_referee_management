import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DesignationsController } from './designations.controller';
import { DesignationsService } from './designations.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { DesignationValidationService } from './services/designation-validation.service';
import { RefereeMatchingService } from './services/referee-matching.service';
import { DesignationOverrideService } from './services/designation-override.service';
import { Designation, DesignationSchema } from './schemas/designation.schema';
import {
  Availability,
  AvailabilitySchema,
} from './schemas/availability.schema';
import { Match, MatchSchema } from '../matches/schemas/match.schema';
import { Referee, RefereeSchema } from '../referees/schemas/referee.schema';
import { Team, TeamSchema } from '../teams/schemas/team.schema';
import {
  InspectorReport,
  InspectorReportSchema,
} from '../inspector-reports/schemas/inspector-report.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Designation.name, schema: DesignationSchema },
      { name: Availability.name, schema: AvailabilitySchema },
      { name: Match.name, schema: MatchSchema },
      { name: Referee.name, schema: RefereeSchema },
      { name: Team.name, schema: TeamSchema },
      { name: InspectorReport.name, schema: InspectorReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [DesignationsController, AvailabilityController],
  providers: [
    DesignationsService,
    AvailabilityService,
    DesignationValidationService,
    RefereeMatchingService,
    DesignationOverrideService,
  ],
  exports: [
    DesignationsService,
    DesignationValidationService,
    RefereeMatchingService,
    DesignationOverrideService,
  ],
})
export class DesignationsModule {}
