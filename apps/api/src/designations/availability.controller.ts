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
  ApiQuery,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { Availability } from './schemas/availability.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '../common/enums';
import {
  CreateAvailabilityDto,
  ApproveAvailabilityDto,
  RejectAvailabilityDto,
  ReportMyUnavailabilityDto,
} from './dto/availability.dto';

@ApiTags('Availability')
@ApiBearerAuth()
@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ===== ARBITRE ENDPOINTS =====

  @Post('report')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Report my unavailability (injury/excuse)',
    description:
      'Referee reports their own unavailability directly to CRA. Use this when injured or need to be excused from refereeing.',
  })
  @ApiBody({ type: ReportMyUnavailabilityDto })
  @ApiResponse({
    status: 201,
    description: 'Unavailability reported and CRA notified',
  })
  reportMyUnavailability(
    @Body() dto: ReportMyUnavailabilityDto,
    @CurrentUser() user: any,
  ) {
    return this.availabilityService.reportMyUnavailability(user.userId, dto);
  }

  @Get('my')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my unavailability reports',
    description:
      'Retrieve all unavailability reports submitted by the authenticated referee',
  })
  @ApiResponse({
    status: 200,
    description: 'List of my unavailability reports',
  })
  getMyUnavailability(@CurrentUser() user: any) {
    return this.availabilityService.findMyUnavailability(user.userId);
  }

  // ===== CRA ENDPOINTS =====

  @Get('cra/pending')
  @Roles(Role.CRA, Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get pending unavailability reports for CRA',
    description:
      'Retrieve all pending unavailability reports from referees in the CRA region',
  })
  @ApiQuery({ name: 'region', required: true, description: 'CRA region' })
  @ApiResponse({
    status: 200,
    description: 'List of pending unavailability reports for CRA review',
  })
  getPendingForCRA(@Query('region') region: string) {
    return this.availabilityService.findPendingForCRA(region);
  }

  // ===== EXISTING ENDPOINTS =====

  @Post()
  @Roles(Role.CRA, Role.ARBITRE, Role.ADMIN_DNA, Role.DESIGNATION_DNA)
  @ApiOperation({
    summary: 'Create availability',
    description: 'Referee submits availability for upcoming matches',
  })
  @ApiBody({ type: CreateAvailabilityDto })
  @ApiResponse({
    status: 201,
    description: 'Availability created successfully',
  })
  create(@Body() createDto: CreateAvailabilityDto, @CurrentUser() user: any) {
    return this.availabilityService.create(createDto, user.userId, user.role);
  }

  @Get()
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CRA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
  )
  @ApiOperation({
    summary: 'Get all availability records',
    description: 'Retrieve all referee availability records',
  })
  @ApiResponse({
    status: 200,
    description: 'List of availability records retrieved successfully',
  })
  findAll(@CurrentUser() user: any) {
    return this.availabilityService.findAll(user.role);
  }

  @Get('active')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CRA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
  )
  @ApiOperation({
    summary: 'Get active availability',
    description: 'Retrieve all active availability records',
  })
  @ApiResponse({
    status: 200,
    description: 'Active availability records retrieved successfully',
  })
  findActive(@CurrentUser() user: any): Promise<Availability[]> {
    return this.availabilityService.findActive(user.role);
  }

  @Get('referee/:refereeId')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CRA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.ARBITRE,
  )
  findByReferee(@Param('refereeId') refereeId: string, @CurrentUser() user: any) {
    return this.availabilityService.findByReferee(refereeId, user.role);
  }

  @Get('date/:date')
  @Roles(
    Role.DESIGNATION_DNA,
    Role.ADMIN_DNA,
    Role.CRA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
  )
  findByDate(@Param('date') date: string, @CurrentUser() user: any) {
    return this.availabilityService.findByDate(date, user.role);
  }

  @Patch(':id/approve')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA, Role.CRA)
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveAvailabilityDto,
    @CurrentUser() user: any,
  ): Promise<Availability> {
    return this.availabilityService.approve(id, user.userId, dto, user.role);
  }

  @Patch(':id/reject')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA, Role.CRA)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectAvailabilityDto,
    @CurrentUser() user: any,
  ): Promise<Availability> {
    return this.availabilityService.reject(id, user.userId, dto, user.role);
  }

  @Delete(':id')
  @Roles(Role.DESIGNATION_DNA, Role.ADMIN_DNA, Role.CRA, Role.ARBITRE)
  remove(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.availabilityService.remove(id, user.role);
  }
}
