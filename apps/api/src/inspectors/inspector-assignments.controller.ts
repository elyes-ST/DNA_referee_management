import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InspectorAssignmentsService } from './inspector-assignments.service';
import {
  CreateInspectorAssignmentDto,
  CancelAssignmentDto,
  FilterAssignmentsDto,
} from './dto';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role } from '../common/enums';

@ApiTags('Inspector Assignments (CDC)')
@ApiBearerAuth()
@Controller('inspector-assignments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InspectorAssignmentsController {
  constructor(
    private readonly assignmentsService: InspectorAssignmentsService,
  ) {}

  /**
   * POST /inspector-assignments
   * Assign an inspector to a match (CDC action)
   */
  @Post()
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign inspector to match (CDC)' })
  @ApiResponse({ status: 201, description: 'Inspector assigned to match' })
  async create(
    @Body() createDto: CreateInspectorAssignmentDto,
    @Request() req,
  ) {
    const assignment = await this.assignmentsService.create(
      createDto,
      req.user.userId,
    );
    return {
      success: true,
      message: 'Inspecteur affecté au match avec succès',
      data: assignment,
    };
  }

  /**
   * GET /inspector-assignments
   * Get all assignments with filters
   */
  @Get()
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Get all inspector assignments' })
  async findAll(@Query() filterDto: FilterAssignmentsDto) {
    const assignments = await this.assignmentsService.findAll(filterDto);
    return {
      success: true,
      count: assignments.length,
      data: assignments,
    };
  }

  /**
   * GET /inspector-assignments/dashboard
   * CDC Dashboard with statistics
   */
  @Get('dashboard')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Get CDC dashboard statistics' })
  async getDashboard() {
    const stats = await this.assignmentsService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /inspector-assignments/awaiting-report
   * Assignments awaiting report submission
   */
  @Get('awaiting-report')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Get assignments awaiting report' })
  async findAwaitingReport() {
    const assignments = await this.assignmentsService.findAwaitingReport();
    return {
      success: true,
      count: assignments.length,
      data: assignments,
    };
  }

  /**
   * GET /inspector-assignments/match/:matchId
   * Get assignments for a specific match
   */
  @Get('match/:matchId')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Get assignments for a match' })
  async findByMatch(@Param('matchId') matchId: string) {
    const assignments = await this.assignmentsService.findByMatch(matchId);
    return {
      success: true,
      count: assignments.length,
      data: assignments,
    };
  }

  /**
   * GET /inspector-assignments/inspector/:inspectorId
   * Get assignments for a specific inspector
   */
  @Get('inspector/:inspectorId')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Get assignments for an inspector' })
  async findByInspector(@Param('inspectorId') inspectorId: string) {
    const assignments =
      await this.assignmentsService.findByInspector(inspectorId);
    return {
      success: true,
      count: assignments.length,
      data: assignments,
    };
  }

  /**
   * GET /inspector-assignments/:id
   * Get assignment by ID
   */
  @Get(':id')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Get assignment by ID' })
  async findOne(@Param('id') id: string) {
    const assignment = await this.assignmentsService.findById(id);
    return {
      success: true,
      data: assignment,
    };
  }

  /**
   * POST /inspector-assignments/:id/cancel
   * Cancel an assignment
   */
  @Post(':id/cancel')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an assignment' })
  async cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelAssignmentDto,
    @Request() req,
  ) {
    const assignment = await this.assignmentsService.cancel(
      id,
      req.user.userId,
      cancelDto,
    );
    return {
      success: true,
      message: 'Affectation annulée',
      data: assignment,
    };
  }

  /**
   * POST /inspector-assignments/:id/link-report
   * Link a report to assignment (after CDC enters the report)
   */
  @Post(':id/link-report')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link report to assignment' })
  async linkReport(
    @Param('id') id: string,
    @Body('reportId') reportId: string,
  ) {
    const assignment = await this.assignmentsService.linkReport(id, reportId);
    return {
      success: true,
      message: "Rapport lié à l'affectation",
      data: assignment,
    };
  }
}
