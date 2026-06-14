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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InspectorReportsService } from './inspector-reports.service';
import {
  CreateInspectorReportDto,
  UpdateInspectorReportDto,
} from './dto/inspector-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, InspectionType } from '../common/enums';

@ApiTags('Inspector Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inspector-reports')
export class InspectorReportsController {
  constructor(
    private readonly inspectorReportsService: InspectorReportsService,
  ) { }

  @Post()
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Create inspector report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  create(@Body() dto: CreateInspectorReportDto, @Request() req: any) {
    return this.inspectorReportsService.create(dto, req.user.userId);
  }

  @Get()
  @Roles(Role.ADMIN_DNA, Role.CDC, Role.DESIGNATION_DNA)
  @ApiOperation({ summary: 'Get all inspector reports with pagination' })
  @ApiQuery({ name: 'inspectorId', required: false })
  @ApiQuery({ name: 'refereeId', required: false })
  @ApiQuery({ name: 'inspectionType', enum: InspectionType, required: false })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by report status (DRAFT, SUBMITTED, REVIEWED, ARCHIVED)' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  findAll(
    @Query('inspectorId') inspectorId?: string,
    @Query('refereeId') refereeId?: string,
    @Query('inspectionType') inspectionType?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inspectorReportsService.findAll({
      inspectorId,
      refereeId,
      inspectionType,
      status,
      dateFrom,
      dateTo,
      page,
      limit,
    });
  }


  @Get('referee/:refereeId')
  @Roles(Role.ADMIN_DNA, Role.CDC, Role.DESIGNATION_DNA)
  @ApiOperation({ summary: 'Get all reports for specific referee' })
  @ApiResponse({
    status: 200,
    description: 'Complete evaluation history with trends',
  })
  findByReferee(@Param('refereeId') refereeId: string) {
    return this.inspectorReportsService.findByReferee(refereeId);
  }

  @Get('referee/:refereeId/latest')
  @Roles(Role.ADMIN_DNA, Role.CDC, Role.DESIGNATION_DNA)
  @ApiOperation({ summary: 'Get latest report for referee' })
  @ApiResponse({ status: 200, description: 'Most recent inspection report' })
  findLatestByReferee(@Param('refereeId') refereeId: string) {
    return this.inspectorReportsService.findLatestByReferee(refereeId);
  }

  @Get(':id')
  @Roles(Role.ADMIN_DNA, Role.CDC, Role.DESIGNATION_DNA)
  @ApiOperation({ summary: 'Get inspector report details' })
  findOne(@Param('id') id: string) {
    return this.inspectorReportsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Update inspector report' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInspectorReportDto,
    @Request() req: any,
  ) {
    return this.inspectorReportsService.update(id, dto, req.user.userId);
  }

  @Patch(':id/submit')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Submit report for review' })
  submit(@Param('id') id: string, @Request() req: any) {
    return this.inspectorReportsService.submit(id, req.user.userId);
  }

  @Patch(':id/review')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({ summary: 'Mark report as reviewed' })
  review(@Param('id') id: string, @Request() req: any) {
    return this.inspectorReportsService.review(id, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({ summary: 'Archive inspector report' })
  remove(@Param('id') id: string) {
    return this.inspectorReportsService.remove(id);
  }
}
