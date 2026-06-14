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
import { InspectorsService } from './inspectors.service';
import { CreateInspectorDto, UpdateInspectorDto, FilterInspectorDto } from './dto';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role } from '../common/enums';

@ApiTags('Inspectors')
@ApiBearerAuth()
@Controller('inspectors')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InspectorsController {
  constructor(private readonly inspectorsService: InspectorsService) { }

  @Post()
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({
    summary: 'Create inspector with user account (CDC)',
    description:
      'Create a new inspector profile and automatically create associated user account with INSPECTOR role',
  })
  @ApiBody({
    type: CreateInspectorDto,
    examples: {
      default: {
        summary: 'Create Inspector Example',
        value: {
          email: 'inspector@dna.tn',
          password: 'Inspector123!',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+216 12345678',
          matricule: 'INS2024001',
          region: 'Tunis',
          specialization: 'Technical inspection',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Inspector and user account created successfully. Returns inspector with populated user data (password excluded).',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (validation failed)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or matricule already exists',
  })
  create(@Body() createInspectorDto: CreateInspectorDto) {
    return this.inspectorsService.create(createInspectorDto);
  }

  @Get()
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({
    summary: 'Get all inspectors',
    description: 'Retrieve all inspectors with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of inspectors retrieved successfully',
  })
  findAll(@Query() filterDto: FilterInspectorDto) {
    return this.inspectorsService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({
    summary: 'Get inspector by ID',
    description: 'Retrieve a specific inspector by ID',
  })
  @ApiParam({ name: 'id', description: 'Inspector ID' })
  @ApiResponse({ status: 200, description: 'Inspector retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inspector not found' })
  findOne(@Param('id') id: string) {
    return this.inspectorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({
    summary: 'Update inspector',
    description: 'Update inspector information',
  })
  @ApiParam({ name: 'id', description: 'Inspector ID' })
  @ApiBody({ type: UpdateInspectorDto })
  @ApiResponse({ status: 200, description: 'Inspector updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspector not found' })
  update(
    @Param('id') id: string,
    @Body() updateInspectorDto: UpdateInspectorDto,
  ) {
    return this.inspectorsService.update(id, updateInspectorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_DNA, Role.CDC)
  @ApiOperation({
    summary: 'Delete inspector',
    description: 'Delete inspector profile',
  })
  @ApiParam({ name: 'id', description: 'Inspector ID' })
  @ApiResponse({ status: 200, description: 'Inspector deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inspector not found' })
  remove(@Param('id') id: string) {
    return this.inspectorsService.remove(id);
  }
}
