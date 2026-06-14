import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DesignationsService } from './designations.service';
import {
  RefereeMatchingService,
  RefereeSuggestion,
} from './services/referee-matching.service';
import { DesignationOverrideService } from './services/designation-override.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role, RefereeRole } from '../common/enums';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
  FilterDesignationsDto,
  ValidateDesignationDto,
  BulkAssignDto,
} from './dto/designation.dto';

@ApiTags('Designations')
@ApiBearerAuth()
@Controller('designations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesignationsController {
  constructor(
    private readonly designationsService: DesignationsService,
    private readonly matchingService: RefereeMatchingService,
    private readonly overrideService: DesignationOverrideService,
  ) { }

  @Post()
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Create designation',
    description: 'Assign a referee to a match',
  })
  @ApiBody({ type: CreateDesignationDto })
  @ApiResponse({ status: 201, description: 'Designation created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or referee unavailable',
  })
  create(@Body() createDto: CreateDesignationDto, @CurrentUser() user: any) {
    return this.designationsService.create(createDto, user.userId, user.role);
  }

  @Get('my')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my designations',
    description:
      'Retrieve all designations where the authenticated referee is assigned',
  })
  @ApiResponse({
    status: 200,
    description: "List of referee's designations retrieved successfully",
  })
  getMyDesignations(@CurrentUser() user: any) {
    return this.designationsService.findByRefereeUserId(user.userId);
  }

  @Get('my/upcoming')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my upcoming matches',
    description:
      'Retrieve upcoming match designations for the authenticated referee',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming designations retrieved successfully',
  })
  getMyUpcomingDesignations(@CurrentUser() user: any) {
    return this.designationsService.findUpcomingByRefereeUserId(user.userId);
  }

  @Get()
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get all designations',
    description: 'Retrieve all referee designations with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of designations retrieved successfully',
  })
  findAll(@Query() filterDto: FilterDesignationsDto, @CurrentUser() user: any) {
    return this.designationsService.findAll(filterDto, user.role);
  }

  @Get('calendar')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  getCalendar(@Query('saison') saison: string, @Query('month') month?: string, @CurrentUser() user?: any) {
    return this.designationsService.getCalendar(saison, month, user?.role);
  }

  @Get('match/:matchId')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
    Role.ARBITRE,
  )
  findByMatch(@Param('matchId') matchId: string, @CurrentUser() user: any) {
    return this.designationsService.findByMatch(matchId, user.role);
  }

  @Get('suggestions/:matchId')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  getSuggestions(
    @Param('matchId') matchId: string,
    @Query('role') role: RefereeRole,
    @Query('count') count?: number,
  ): Promise<RefereeSuggestion[]> {
    return this.matchingService.suggestReferees(matchId, role, count || 5);
  }

  @Get('eligible/:matchId')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get eligible referees for a match',
    description:
      'Returns all referees who pass every designation validation rule for the given match. ' +
      'Optionally filter by role. Each entry includes the full referee+user data and any soft warnings.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of eligible referees with optional warnings',
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  getEligibleReferees(
    @Param('matchId') matchId: string,
    @Query('role') role?: RefereeRole,
    @CurrentUser() user?: any,
  ) {
    return this.designationsService.getEligibleReferees(matchId, role, user?.role);
  }


  @Get(':id')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
    Role.ARBITRE,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.designationsService.findOne(id, user.role);
  }


  @Patch(':id')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDesignationDto,
    @CurrentUser() user: any,
  ) {
    return this.designationsService.update(id, updateDto, user.userId, user.role);
  }

  @Patch(':id/submit')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.designationsService.submit(id, user.role);
  }

  @Patch(':id/validate')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  validate(
    @Param('id') id: string,
    @Body() validateDto: ValidateDesignationDto,
    @CurrentUser() user: any,
  ) {
    return this.designationsService.validate(
      id,
      user.userId,
      user.role,
      validateDto,
    );
  }

  @Delete(':id')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.designationsService.remove(id, user.role);
  }

  @Post(':id/send-notifications')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA)
  sendNotifications(@Param('id') id: string) {
    return this.designationsService.sendNotifications(id);
  }

  @Post('bulk-assign')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA)
  bulkAssign(@Body() bulkAssignDto: BulkAssignDto, @CurrentUser() user: any) {
    return this.designationsService.bulkAssign(bulkAssignDto, user.userId);
  }

  @Post(':id/override')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({
    summary: 'Override system-proposed designation with manual selection',
  })
  @ApiResponse({
    status: 200,
    description: 'Designation overridden successfully',
  })
  overrideDesignation(
    @Param('id') id: string,
    @Body()
    body: {
      newReferees: Array<{ refereeId: string; role: RefereeRole }>;
      reason: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.overrideService.overrideDesignation(
      id,
      body.newReferees,
      body.reason,
      user.userId,
    );
  }

  @Post(':id/take-control')
  @Roles(Role.CRA)
  @ApiOperation({ summary: 'CRA President takes full control of designation' })
  @ApiResponse({ status: 200, description: 'Control taken successfully' })
  takeControl(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.overrideService.takeControl(id, user.userId, body.reason);
  }

  @Get(':id/override-history')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({ summary: 'Get complete override history for a designation' })
  @ApiResponse({ status: 200, description: 'Override history retrieved' })
  getOverrideHistory(@Param('id') id: string) {
    return this.overrideService.getOverrideHistory(id);
  }

  @Get('overrides/all')
  @Roles(Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({ summary: 'Get all overrides across system for audit' })
  @ApiResponse({ status: 200, description: 'All overrides retrieved' })
  getAllOverrides(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (userId) filters.userId = userId;
    return this.overrideService.getAllOverrides(filters);
  }

  @Post(':id/revert-override')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({
    summary: 'Revert to previous designation state (undo override)',
  })
  @ApiResponse({ status: 200, description: 'Override reverted successfully' })
  revertOverride(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.overrideService.revertOverride(id, user.userId, body.reason);
  }
}
