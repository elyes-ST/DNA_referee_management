import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from './statistics.controller';
import { StatisticsAnalysisService } from './statistics-analysis.service';
import { Referee, RefereeSchema } from '../referees/schemas/referee.schema';
import {
  InspectorReport,
  InspectorReportSchema,
} from '../inspector-reports/schemas/inspector-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referee.name, schema: RefereeSchema },
      { name: InspectorReport.name, schema: InspectorReportSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsAnalysisService],
  exports: [StatisticsAnalysisService],
})
export class StatisticsModule {}
