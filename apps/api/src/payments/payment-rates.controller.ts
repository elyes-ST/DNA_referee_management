import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentRatesService } from './payment-rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '../common/enums';
import {
  CreatePaymentRateDto,
  UpdatePaymentRateDto,
  FilterPaymentRatesDto,
} from './dto/payment-rate.dto';

@ApiTags('Payment Rates')
@ApiBearerAuth()
@Controller('payment-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentRatesController {
  constructor(private readonly paymentRatesService: PaymentRatesService) { }

  @Post()
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Create payment rate',
    description: 'Create a new payment rate for a category + competition + role + season combination.',
  })
  @ApiBody({ type: CreatePaymentRateDto })
  @ApiResponse({ status: 201, description: 'Payment rate created successfully' })
  create(@Body() createDto: CreatePaymentRateDto, @CurrentUser() user: any) {
    return this.paymentRatesService.create(createDto, user.userId);
  }

  @Get()
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get all payment rates',
    description: 'List all payment rates. Supports ?category=A&saison=2025-2026&page=1&limit=20',
  })
  @ApiResponse({ status: 200, description: 'List of payment rates retrieved successfully' })
  findAll(@Query() filterDto: FilterPaymentRatesDto) {
    return this.paymentRatesService.findAll(filterDto);
  }

  @Get('active')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get active payment rates',
    description: 'Rates whose effectiveTo is null or in the future.',
  })
  @ApiResponse({ status: 200, description: 'Active payment rates retrieved successfully' })
  findActive() {
    return this.paymentRatesService.findActive();
  }

  @Get(':id')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({ summary: 'Get payment rate by ID' })
  @ApiResponse({ status: 200, description: 'Payment rate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment rate not found' })
  findOne(@Param('id') id: string) {
    return this.paymentRatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Update payment rate',
    description: 'Update amount or effectiveTo date. Does NOT delete historical records.',
  })
  @ApiResponse({ status: 200, description: 'Payment rate updated successfully' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePaymentRateDto) {
    return this.paymentRatesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Delete payment rate',
    description: 'Delete a payment rate entirely.',
  })
  @ApiResponse({ status: 200, description: 'Payment rate deleted successfully' })
  remove(@Param('id') id: string) {
    return this.paymentRatesService.remove(id);
  }
}
