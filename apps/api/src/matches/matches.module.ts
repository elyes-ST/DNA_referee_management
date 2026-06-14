import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { Match, MatchSchema } from './schemas/match.schema';
import { Team, TeamSchema } from '../teams/schemas/team.schema';
import { ExcelService } from '../common/services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
  ],
  controllers: [MatchesController],
  providers: [MatchesService, ExcelService],
  exports: [MatchesService],
})
export class MatchesModule {}
