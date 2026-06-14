import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  DashboardService,
  DashboardFilters,
  GlobalDashboardStats,
} from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get global dashboard statistics
   * User Story 37: Page d'accueil avec stats globales (graphes, filtres journée/mois/saison)
   */
  @Get()
  @Roles(Role.ADMIN_DNA, Role.ARBITRE, Role.INSPECTEUR, Role.CRA)
  @ApiOperation({
    summary: 'Get global dashboard statistics',
    description:
      'Returns aggregated statistics for matches, referees, designations, convocations, reports, and payments. Supports filtering by season, journee, month, region, and league.',
  })
  @ApiQuery({
    name: 'saison',
    required: false,
    example: '2025-2026',
    description: 'Filter by season',
  })
  @ApiQuery({
    name: 'journee',
    required: false,
    example: 1,
    description: 'Filter by journee',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    example: 1,
    description: 'Filter by month (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    example: 2025,
    description: 'Filter by year',
  })
  @ApiQuery({
    name: 'region',
    required: false,
    description: 'Filter by region',
  })
  @ApiQuery({
    name: 'league',
    required: false,
    description: 'Filter by league',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalMatches: { type: 'number' },
            matchesThisSeason: { type: 'number' },
            matchesThisMonth: { type: 'number' },
            matchesToday: { type: 'number' },
            upcomingMatches: { type: 'number' },
          },
        },
        referees: {
          type: 'object',
          properties: {
            totalActive: { type: 'number' },
            byCategory: { type: 'object' },
            recentlyUpdated: { type: 'number' },
          },
        },
        designations: {
          type: 'object',
          properties: {
            pending: { type: 'number' },
            validated: { type: 'number' },
            total: { type: 'number' },
            completionRate: { type: 'number' },
          },
        },
        convocations: {
          type: 'object',
          properties: {
            upcoming: { type: 'number' },
            thisMonth: { type: 'number' },
          },
        },
        inspectorReports: {
          type: 'object',
          properties: {
            pending: { type: 'number' },
            submitted: { type: 'number' },
            reviewed: { type: 'number' },
          },
        },
        payments: {
          type: 'object',
          properties: {
            pendingValidation: { type: 'number' },
            validatedThisMonth: { type: 'number' },
            totalAmountThisMonth: { type: 'number' },
          },
        },
        recentActivity: {
          type: 'object',
          properties: {
            latestMatches: { type: 'array', items: { type: 'object' } },
            latestDesignations: { type: 'array', items: { type: 'object' } },
            latestReports: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  })
  async getGlobalStats(
    @Query('saison') saison?: string,
    @Query('journee') journee?: number,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('region') region?: string,
    @Query('league') league?: string,
  ): Promise<GlobalDashboardStats> {
    const filters: DashboardFilters = {
      saison,
      journee: journee ? Number(journee) : undefined,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      region,
      league,
    };
    return this.dashboardService.getGlobalStats(filters);
  }

  /**
   * Get matches chart data for visualization
   */
  @Get('charts/matches')
  @Roles(Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({
    summary: 'Get matches chart data',
    description:
      'Returns match data grouped by journee or month for chart visualization',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['journee', 'month'],
    description: 'Group data by journee or month',
  })
  @ApiQuery({
    name: 'saison',
    required: false,
    example: '2025-2026',
    description: 'Filter by season',
  })
  @ApiQuery({
    name: 'league',
    required: false,
    description: 'Filter by league',
  })
  @ApiResponse({
    status: 200,
    description: 'Chart data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Group key (journee number or month)',
          },
          total: { type: 'number' },
          completed: { type: 'number' },
          upcoming: { type: 'number' },
        },
      },
    },
  })
  async getMatchesChartData(
    @Query('groupBy') groupBy?: 'journee' | 'month',
    @Query('saison') saison?: string,
    @Query('league') league?: string,
  ) {
    return this.dashboardService.getMatchesChartData(groupBy || 'journee', {
      saison,
      league,
    });
  }

  /**
   * Get referee performance trends
   */
  @Get('charts/referee-performance')
  @Roles(Role.ADMIN_DNA, Role.INSPECTEUR)
  @ApiOperation({
    summary: 'Get referee performance trends',
    description:
      'Returns referee performance scores over time based on inspector reports',
  })
  @ApiQuery({
    name: 'saison',
    required: false,
    example: '2025-2026',
    description: 'Filter by season',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance trends retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'object',
            properties: {
              year: { type: 'number' },
              month: { type: 'number' },
            },
          },
          averageScore: { type: 'number' },
          totalReports: { type: 'number' },
        },
      },
    },
  })
  async getRefereePerformanceTrends(@Query('saison') saison?: string) {
    return this.dashboardService.getRefereePerformanceTrends({ saison });
  }
}
