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
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CraPresidentsService } from './cra-presidents.service';
import { CreateCRAPresidentDto, UpdateCRAPresidentDto, FilterCRAPresidentDto } from './dto';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role } from '../common/enums';

@ApiTags('CRA Presidents')
@ApiBearerAuth()
@Controller('cra-presidents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CraPresidentsController {
  constructor(private readonly craPresidentsService: CraPresidentsService) { }

  @Post()
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Create CRA president with user account',
    description:
      'Create a new CRA president profile and automatically create associated user account with CRA_PRESIDENT role',
  })
  @ApiBody({
    type: CreateCRAPresidentDto,
    examples: {
      default: {
        summary: 'Create CRA President Example',
        value: {
          email: 'cra.president@dna.tn',
          password: 'CRA123!',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+216 12345678',
          region: 'Tunis',
          startDate: '2026-01-01',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'CRA president and user account created successfully. Returns president with populated user data (password excluded).',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (validation failed)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists or region already has a president',
  })
  create(@Body() createCRAPresidentDto: CreateCRAPresidentDto) {
    return this.craPresidentsService.create(createCRAPresidentDto);
  }

  @Get()
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get all CRA presidents',
    description: 'Retrieve all CRA presidents with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of CRA presidents retrieved successfully',
  })
  findAll(@Query() filterDto: FilterCRAPresidentDto) {
    return this.craPresidentsService.findAll(filterDto);
  }

  @Get('region/:region')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get CRA presidents by region',
    description: 'Retrieve all CRA presidents in a specific region',
  })
  @ApiParam({ name: 'region', description: 'Region name' })
  @ApiResponse({
    status: 200,
    description: 'CRA presidents retrieved successfully',
  })
  findByRegion(@Param('region') region: string) {
    return this.craPresidentsService.findByRegion(region);
  }

  @Get(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get CRA president by ID',
    description: 'Retrieve a specific CRA president by ID',
  })
  @ApiParam({ name: 'id', description: 'CRA President ID' })
  @ApiResponse({
    status: 200,
    description: 'CRA president retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'CRA president not found' })
  findOne(@Param('id') id: string) {
    return this.craPresidentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Update CRA president',
    description: 'Update CRA president information',
  })
  @ApiParam({ name: 'id', description: 'CRA President ID' })
  @ApiBody({ type: UpdateCRAPresidentDto })
  @ApiResponse({
    status: 200,
    description: 'CRA president updated successfully',
  })
  @ApiResponse({ status: 404, description: 'CRA president not found' })
  update(
    @Param('id') id: string,
    @Body() updateCRAPresidentDto: UpdateCRAPresidentDto,
  ) {
    return this.craPresidentsService.update(id, updateCRAPresidentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Delete CRA president',
    description: 'Delete CRA president profile',
  })
  @ApiParam({ name: 'id', description: 'CRA President ID' })
  @ApiResponse({
    status: 200,
    description: 'CRA president deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'CRA president not found' })
  remove(@Param('id') id: string) {
    return this.craPresidentsService.remove(id);
  }
}
