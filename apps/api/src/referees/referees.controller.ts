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
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { RefereesService } from './referees.service';
import {
  CreateRefereeDto,
  UpdateRefereeDto,
  FilterRefereesDto,
  UpdateMyRefereeProfileDto,
} from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role } from '../common/enums';

@ApiTags('Referees')
@ApiBearerAuth()
@Controller('referees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RefereesController {
  constructor(private readonly refereesService: RefereesService) {}

  @Get('me')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Get my referee profile',
    description:
      "Retrieve the authenticated referee's own profile with statistics",
  })
  @ApiResponse({
    status: 200,
    description: 'Referee profile retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Referee profile not found' })
  getMyProfile(@CurrentUser() user: any) {
    return this.refereesService.findByUserId(user.userId);
  }

  @Patch('me')
  @Roles(Role.ARBITRE)
  @ApiOperation({
    summary: 'Update my referee profile',
    description:
      "Update the authenticated referee's profile (limited fields: address, emergency contact, notes)",
  })
  @ApiBody({ type: UpdateMyRefereeProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Referee profile not found' })
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateMyRefereeProfileDto,
  ) {
    return this.refereesService.updateMyProfile(user.userId, updateDto);
  }

  @Post()
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Create referee with user account',
    description:
      'Create a new referee profile and automatically create associated user account with REFEREE role',
  })
  @ApiBody({
    type: CreateRefereeDto,
    examples: {
      default: {
        summary: 'Create Referee Example',
        value: {
          email: 'referee@dna.tn',
          password: 'Referee123!',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+216 12345678',
          matricule: 'REF2024001',
          category: 'ELITE',
          league: 'Ligue 1',
          region: 'Tunis',
          dateOfBirth: '1990-01-15',
          cin: '12345678',
          address: '123 Street, Tunis',
          emergencyContact: {
            name: 'Jane Doe',
            phone: '+216 87654321',
          },
          isAvailable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Referee and user account created successfully. Returns referee with populated user data (password excluded).',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (validation failed)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or matricule already exists',
  })
  create(@Body() createRefereeDto: CreateRefereeDto, @CurrentUser() user: any) {
    return this.refereesService.create(createRefereeDto, user.role);
  }

  @Get()
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.FINANCE_DNA,
    Role.CDC,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get all referees',
    description: 'Retrieve all referees with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of referees retrieved successfully',
  })
  findAll(@Query() filterDto: FilterRefereesDto, @CurrentUser() user: any) {
    return this.refereesService.findAll(filterDto, user.role);
  }

  @Get('statistics')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get referee statistics',
    description: 'Retrieve statistics about referees',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStatistics(@CurrentUser() user: any) {
    return this.refereesService.getStatistics(user.role);
  }

  @Get('category/:category')
  @Roles(
    Role.ADMIN_DNA,
    Role.DESIGNATION_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get referees by category',
    description: 'Retrieve all referees in a specific category',
  })
  @ApiParam({ name: 'category', description: 'Referee category' })
  @ApiResponse({ status: 200, description: 'Referees retrieved successfully' })
  findByCategory(@Param('category') category: string) {
    return this.refereesService.findByCategory(category);
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
    summary: 'Get referee by ID',
    description: 'Retrieve a specific referee by ID',
  })
  @ApiParam({ name: 'id', description: 'Referee ID' })
  @ApiResponse({ status: 200, description: 'Referee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Referee not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.refereesService.findOne(id, user.role);
  }

  @Patch(':id')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA)
  @ApiOperation({
    summary: 'Update referee',
    description: 'Update referee information',
  })
  @ApiParam({ name: 'id', description: 'Referee ID' })
  @ApiBody({ type: UpdateRefereeDto })
  @ApiResponse({ status: 200, description: 'Referee updated successfully' })
  @ApiResponse({ status: 404, description: 'Referee not found' })
  update(
    @Param('id') id: string,
    @Body() updateRefereeDto: UpdateRefereeDto,
    @CurrentUser() user: any,
  ) {
    return this.refereesService.update(id, updateRefereeDto, user.role);
  }

  @Delete(':id')
  @Roles(
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Delete referee',
    description: 'Delete referee profile',
  })
  @ApiParam({ name: 'id', description: 'Referee ID' })
  @ApiResponse({ status: 200, description: 'Referee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Referee not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.refereesService.remove(id, user.role);
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
  @ApiOperation({
    summary: 'Import referees from Excel',
    description: 'Bulk import referees from Excel file',
  })
  @ApiResponse({ status: 201, description: 'Referees imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  async importFromExcel(@UploadedFile() file: any, @CurrentUser() user: any) {
    return this.refereesService.importFromExcel(file.buffer, user.role);
  }
}
