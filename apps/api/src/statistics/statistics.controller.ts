import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatisticsAnalysisService } from './statistics-analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role, RefereeCategory } from '../common/enums';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsAnalysisService: StatisticsAnalysisService,
  ) { }

  // ===== ARBITRE ENDPOINTS =====

  @Get('my')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my statistics',
    description:
      "Retrieve the authenticated referee's own performance statistics",
  })
  @ApiResponse({
    status: 200,
    description: 'Referee statistics retrieved successfully',
  })
  getMyStatistics(@CurrentUser() user: any) {
    return this.statisticsAnalysisService.getMyStatistics(user.userId);
  }

  @Get('my/speed-chart')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my performance radar chart',
    description:
      'Retrieve multi-dimensional performance data for the authenticated referee',
  })
  @ApiResponse({
    status: 200,
    description: 'Speed chart data retrieved successfully',
  })
  getMySpeedChart(@CurrentUser() user: any) {
    return this.statisticsAnalysisService.getMySpeedChart(user.userId);
  }

  @Get('my/progression')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my progression over time',
    description: "Track the authenticated referee's performance progression",
  })
  @ApiResponse({
    status: 200,
    description: 'Progression data retrieved successfully',
  })
  getMyProgression(@CurrentUser() user: any) {
    return this.statisticsAnalysisService.getMyProgression(user.userId);
  }

  @Get('my/ranking')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my ranking in category',
    description:
      "Retrieve the authenticated referee's ranking within their category",
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking position retrieved successfully',
  })
  getMyRanking(@CurrentUser() user: any) {
    return this.statisticsAnalysisService.getMyRanking(user.userId);
  }

  // ===== ADMIN ENDPOINTS =====

  @Get('rankings')
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({ summary: 'Get paginated rankings by category' })
  @ApiQuery({ name: 'category', enum: RefereeCategory, required: true })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Results per page (default: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated ranked list of referees',
    schema: {
      example: {
        data: [{ rank: 1, matricule: 'ARB001', firstName: 'Ali', lastName: 'Ben Ali', performanceScore: 8.5 }],
        total: 45,
        page: 1,
        limit: 20,
        totalPages: 3,
      },
    },
  })
  getRankings(
    @Query('category') category: RefereeCategory,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    return this.statisticsAnalysisService.calculateRanking(
      category,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      user?.role,
    );
  }

  @Get('referee/:id/speed-chart')
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({ summary: 'Generate speed/radar chart data for referee' })
  @ApiResponse({
    status: 200,
    description: 'Multi-dimensional performance data',
  })
  getSpeedChart(@Param('id') id: string, @CurrentUser() user: any) {
    return this.statisticsAnalysisService.generateSpeedChartData(id, user.role);
  }

  @Get('referee/:id/comparative-analysis')
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({ summary: 'Comparative analysis with category peers' })
  @ApiResponse({ status: 200, description: 'Comparative statistics' })
  getComparativeAnalysis(@Param('id') id: string, @CurrentUser() user: any) {
    return this.statisticsAnalysisService.compareWithPeers(id, user.role);
  }

  @Get('referee/:id/progression')
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({ summary: 'Track referee progression over time' })
  @ApiResponse({ status: 200, description: 'Progression timeline' })
  getProgression(@Param('id') id: string, @CurrentUser() user: any) {
    return this.statisticsAnalysisService.trackProgression(id, user.role);
  }

  @Get('referee/:id/seminar-notes')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({ summary: 'Get seminar notes history' })
  @ApiResponse({ status: 200, description: 'Seminar attendance and notes' })
  getSeminarNotes(@Param('id') id: string, @CurrentUser() user: any) {
    return this.statisticsAnalysisService.getSeminarNotes(id, user.role);
  }
}
