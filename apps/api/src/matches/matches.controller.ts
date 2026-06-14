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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { MatchesService } from './matches.service';
import {
  CreateMatchDto,
  UpdateMatchDto,
  FilterMatchesDto,
  UpdateMatchDateDto,
  SubmitMatchSheetDto,
} from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role } from '../common/enums';

@ApiTags('Matches')
@ApiBearerAuth()
@Controller('matches')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Create match',
    description: 'Create a new match in the system',
  })
  @ApiBody({ type: CreateMatchDto })
  @ApiResponse({ status: 201, description: 'Match created successfully' })
  create(@Body() createMatchDto: CreateMatchDto, @CurrentUser() user: any) {
    return this.matchesService.create(createMatchDto, user.userId, user.role);
  }

  @Get()
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.FINANCE_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
    Role.CDC,
  )
  @ApiOperation({
    summary: 'Get all matches',
    description:
      'Retrieve all matches with optional filtering by competition, status, season, matchday, and date. Supports pagination.',
  })
  @ApiQuery({
    name: 'competition',
    required: false,
    enum: [
      'LIGUE1',
      'LIGUE2',
      'COUPE',
      'AMATEUR_C1',
      'AMATEUR_C2',
      'JEUNES',
      'FEMININE',
      'REGIONAL',
    ],
    description: 'Filter by competition/league',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['SCHEDULED', 'COMPLETED', 'POSTPONED', 'CANCELLED'],
    description: 'Filter by match status',
  })
  @ApiQuery({
    name: 'saison',
    required: false,
    description: 'Filter by season (e.g., 2025-2026)',
  })
  @ApiQuery({
    name: 'journee',
    required: false,
    type: Number,
    description: 'Filter by matchday number',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by specific date (ISO format: YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matches retrieved successfully with pagination',
  })
  findAll(@Query() filterDto: FilterMatchesDto, @CurrentUser() user: any) {
    return this.matchesService.findAll(filterDto, user.role);
  }

  @Get('calendar')
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get match calendar',
    description: 'Retrieve match calendar filtered by season or date range. If no filters provided, returns all matches.',
  })
  @ApiQuery({ name: 'saison', required: false, description: 'Season year (e.g., 2025-2026)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format: YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Match calendar retrieved successfully',
  })
  getCalendar(
    @Query('saison') saison?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.matchesService.getCalendar(saison, startDate, endDate, user?.role);
  }

  @Get(':id')
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get match by ID',
    description: 'Retrieve a specific match by ID',
  })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.matchesService.findOne(id, user.role);
  }

  @Patch(':id')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Update match',
    description:
      'Update match information including teams, status, VAR availability, and score when match is completed',
  })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiBody({
    type: UpdateMatchDto,
    description:
      'Match update data. Can update team names/IDs, status, hasVAR, and score. When updating team IDs, team names will be auto-populated.',
    examples: {
      updateStatus: {
        summary: 'Update match status',
        value: {
          status: 'COMPLETED',
        },
      },
      updateScore: {
        summary: 'Update match score (when completed)',
        value: {
          status: 'COMPLETED',
          score: {
            homeScore: 2,
            awayScore: 1,
          },
        },
      },
      updateTeams: {
        summary: 'Update team names',
        value: {
          homeTeam: 'Espérance Sportive de Tunis',
          awayTeam: 'Club Africain',
        },
      },
      updateVAR: {
        summary: 'Enable VAR for match',
        value: {
          hasVAR: true,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Match updated successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid team ID',
  })
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto, @CurrentUser() user: any) {
    return this.matchesService.update(id, updateMatchDto, user.role);
  }

  @Patch(':id/date')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  updateDate(
    @Param('id') id: string,
    @Body() updateMatchDateDto: UpdateMatchDateDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.updateDate(id, updateMatchDateDto, user.role);
  }

  @Delete(':id')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    // Pass the role so the service enforces category scope (same guard the
    // create/update/import paths already use). Without it a restricted admin
    // could delete out-of-scope matches.
    return this.matchesService.remove(id, user.role);
  }

  @Post('import')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: any, @CurrentUser() user: any) {
    return this.matchesService.importFromExcel(file.buffer, user.userId, user.role);
  }

  // ===== CRA-SPECIFIC ENDPOINTS =====

  @Post(':id/submit-sheet')
  @Roles(Role.CRA)
  @ApiOperation({
    summary: 'Submit match sheet to DNA',
    description:
      'CRA submits the played match result sheet to DNA for centralized tracking. ' +
      'Updates match status to COMPLETED with the provided score and notes.',
  })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiBody({ type: SubmitMatchSheetDto })
  @ApiResponse({ status: 200, description: 'Match sheet submitted successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  submitMatchSheet(
    @Param('id') id: string,
    @Body() dto: SubmitMatchSheetDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.submitMatchSheet(id, dto, user.userId);
  }
}
