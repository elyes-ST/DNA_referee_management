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
import { TrainingResourcesService } from './training-resources.service';
import {
  CreateTrainingResourceDto,
  UpdateTrainingResourceDto,
  RateResourceDto,
  NotifyRefereesDto,
} from './dto/training-resource.dto';
import { FilterTrainingResourcesDto } from './dto/filter-training-resources.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role, TrainingResourceType, TrainingCategory } from '../common/enums';

@ApiTags('Training Resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-resources')
export class TrainingResourcesController {
  constructor(
    private readonly trainingResourcesService: TrainingResourcesService,
  ) {}

  // ===== ARBITRE ENDPOINTS =====

  @Get('my')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get training resources for me',
    description:
      "Retrieve training resources targeted at the authenticated referee's category",
  })
  @ApiResponse({
    status: 200,
    description: 'Training resources retrieved successfully',
  })
  getMyResources(@CurrentUser() user: any) {
    return this.trainingResourcesService.findResourcesForReferee(user.userId);
  }

  @Get('my/recommended')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get recommended resources based on my performance',
    description:
      'Retrieve recommended training resources based on areas needing improvement',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommended resources retrieved successfully',
  })
  getRecommendedResources(@CurrentUser() user: any) {
    return this.trainingResourcesService.getRecommendedResources(user.userId);
  }

  @Get('my/personal')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my personal videos',
    description:
      'Retrieve videos specifically assigned to me (e.g., analysis of my own matches)',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal videos retrieved successfully',
  })
  getPersonalResources(@CurrentUser() user: any) {
    return this.trainingResourcesService.findPersonalResourcesForReferee(
      user.userId,
    );
  }

  // ===== ADMIN ENDPOINTS =====

  @Post()
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({ summary: 'Create training resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  create(@Body() dto: CreateTrainingResourceDto, @Request() req: any) {
    return this.trainingResourcesService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all training resources',
    description: 'Retrieve all training resources with pagination and filters',
  })
  findAll(@Query() filterDto: FilterTrainingResourcesDto) {
    return this.trainingResourcesService.findAll(filterDto);
  }

  @Get('statistics')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({ summary: 'Get resource usage statistics' })
  getStatistics() {
    return this.trainingResourcesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get training resource details' })
  findOne(@Param('id') id: string) {
    return this.trainingResourcesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({ summary: 'Update training resource' })
  update(@Param('id') id: string, @Body() dto: UpdateTrainingResourceDto) {
    return this.trainingResourcesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({ summary: 'Delete training resource (soft delete)' })
  remove(@Param('id') id: string) {
    return this.trainingResourcesService.remove(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count' })
  incrementView(@Param('id') id: string) {
    return this.trainingResourcesService.incrementView(id);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate training resource' })
  rate(
    @Param('id') id: string,
    @Body() dto: RateResourceDto,
    @Request() req: any,
  ) {
    return this.trainingResourcesService.rateResource(
      id,
      req.user.userId,
      dto.rating,
    );
  }

  @Post(':id/notify-arbitres')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Notify referees about new resource',
    description:
      'Send notifications to referees about a new training resource. Can target specific categories or all referees.',
  })
  @ApiResponse({ status: 200, description: 'Notifications sent successfully' })
  async notifyReferees(
    @Param('id') id: string,
    @Body() dto: NotifyRefereesDto,
  ) {
    const result =
      await this.trainingResourcesService.notifyRefereesAboutResource(
        id,
        dto.targetAudience?.length ? dto.targetAudience : undefined,
        dto.message,
      );
    return {
      message: 'Notifications sent successfully',
      ...result,
    };
  }
}
