import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MatchPaymentsService } from './match-payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Match Payments')
@ApiBearerAuth()
@Controller('match-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchPaymentsController {
  constructor(private readonly matchPaymentsService: MatchPaymentsService) { }

  @Get('match/:matchId')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get match payments by match',
    description: 'Retrieve all MatchPayment records for a specific match',
  })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Match payments retrieved successfully',
  })
  findByMatch(@Param('matchId') matchId: string) {
    return this.matchPaymentsService.findByMatch(matchId);
  }

  @Get('referee/:refereeId')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
    Role.ARBITRE,
  )
  @ApiOperation({
    summary: 'Get match payments by referee',
    description: 'Retrieve all individual match payment records for a referee',
  })
  @ApiParam({ name: 'refereeId', description: 'Referee ID' })
  @ApiResponse({
    status: 200,
    description: 'Referee match payments retrieved successfully',
  })
  findByReferee(@Param('refereeId') refereeId: string) {
    return this.matchPaymentsService.findByReferee(refereeId);
  }
}
