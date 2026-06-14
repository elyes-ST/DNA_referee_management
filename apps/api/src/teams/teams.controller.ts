import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, FilterTeamsDto } from './dto/team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import {
  teamLogoStorage,
  imageFileFilter,
  maxFileSize,
} from '../common/config/multer.config';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(Role.ADMIN_DNA)
  create(@Body() createDto: CreateTeamDto, @Request() req: any) {
     const userId = req.user?.userId ?? null;
    return this.teamsService.create(createDto, userId);
  }

  @Get()
  findAll(@Query() filterDto: FilterTeamsDto) {
    return this.teamsService.findAll(filterDto);
  }

  @Get('regions')
  getRegions() {
    return this.teamsService.getRegions();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Get('region/:region')
  findByRegion(@Param('region') region: string) {
    return this.teamsService.findByRegion(region);
  }

  @Get('league/:league')
  findByLeague(@Param('league') league: string) {
    return this.teamsService.findByLeague(league);
  }

  @Put(':id')
  @Roles(Role.ADMIN_DNA)
  update(@Param('id') id: string, @Body() updateDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_DNA)
  delete(@Param('id') id: string) {
    return this.teamsService.delete(id);
  }

  @Post('seed')
  @Roles(Role.ADMIN_DNA)
  seed() {
    return this.teamsService.seedTeams();
  }

  @Post(':id/logo')
  @Roles(Role.ADMIN_DNA)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: teamLogoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: maxFileSize },
    }),
  )
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return this.teamsService.uploadLogo(id, file);
  }

  @Delete(':id/logo')
  @Roles(Role.ADMIN_DNA)
  deleteLogo(@Param('id') id: string) {
    return this.teamsService.deleteLogo(id);
  }
}
