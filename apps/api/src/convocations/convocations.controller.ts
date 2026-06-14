import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConvocationsService } from './convocations.service';
import {
  CreateConvocationDto,
  UpdateConvocationDto,
  AddSeminarNoteDto,
  FilterConvocationsDto,
} from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role } from '../common/enums';

@ApiTags('Convocations')
@ApiBearerAuth()
@Controller('convocations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ConvocationsController {
  constructor(private readonly convocationsService: ConvocationsService) {}

  @Get('my')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my convocations',
    description:
      'Retrieve all convocations where the authenticated referee is invited',
  })
  @ApiResponse({
    status: 200,
    description: "List of referee's convocations retrieved successfully",
  })
  getMyConvocations(@CurrentUser() user: any) {
    return this.convocationsService.findByRefereeUserId(user.userId);
  }

  @Get('my/upcoming')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my upcoming convocations',
    description: 'Retrieve upcoming convocations for the authenticated referee',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming convocations retrieved successfully',
  })
  getMyUpcomingConvocations(@CurrentUser() user: any) {
    return this.convocationsService.findUpcomingByRefereeUserId(user.userId);
  }

  @Post()
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Create convocation',
    description: 'Create a new referee convocation for training or seminar',
  })
  @ApiBody({ type: CreateConvocationDto })
  @ApiResponse({ status: 201, description: 'Convocation created successfully' })
  create(
    @Body() createConvocationDto: CreateConvocationDto,
    @CurrentUser() user: any,
  ) {
    return this.convocationsService.create(createConvocationDto, user.userId);
  }

  @Get()
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get all convocations',
    description: 'Retrieve all referee convocations with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of convocations retrieved successfully',
  })
  findAll(@Query() filterDto: FilterConvocationsDto) {
    return this.convocationsService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get convocation by ID',
    description: 'Retrieve a specific convocation by ID',
  })
  @ApiParam({ name: 'id', description: 'Convocation ID' })
  @ApiResponse({
    status: 200,
    description: 'Convocation retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Convocation not found' })
  findOne(@Param('id') id: string) {
    return this.convocationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Update convocation',
    description: 'Update convocation information',
  })
  @ApiParam({ name: 'id', description: 'Convocation ID' })
  @ApiBody({ type: UpdateConvocationDto })
  @ApiResponse({ status: 200, description: 'Convocation updated successfully' })
  @ApiResponse({ status: 404, description: 'Convocation not found' })
  update(
    @Param('id') id: string,
    @Body() updateConvocationDto: UpdateConvocationDto,
  ) {
    return this.convocationsService.update(id, updateConvocationDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Delete convocation',
    description: 'Delete a convocation',
  })
  @ApiParam({ name: 'id', description: 'Convocation ID' })
  @ApiResponse({ status: 200, description: 'Convocation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Convocation not found' })
  remove(@Param('id') id: string) {
    return this.convocationsService.remove(id);
  }

  @Post(':id/add-note')
  @Roles(Role.ADMIN_DNA)
  addSeminarNote(
    @Param('id') id: string,
    @Body() addSeminarNoteDto: AddSeminarNoteDto,
  ) {
    return this.convocationsService.addSeminarNote(id, addSeminarNoteDto);
  }

  @Post(':id/send-notifications')
  @Roles(Role.ADMIN_DNA)
  sendNotifications(@Param('id') id: string) {
    return this.convocationsService.sendNotifications(id);
  }
}
