import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { FinancialVisibilityService } from './services/financial-visibility.service';
import { RegionalPDFService } from './services/regional-pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '../common/enums';
import {
  GeneratePaymentDto,
  FilterPaymentsDto,
  ValidatePaymentDto,
  RejectPaymentDto,
  MarkPaidDto,
  BulkValidateDto,
  PaymentStatisticsDto,
  PreviewMatchesDto,
  PreviewTotalDto,
} from './dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly pdfService: RegionalPDFService,
    private readonly paymentsService: PaymentsService,
    private readonly visibilityService: FinancialVisibilityService,
  ) { }

  @Post('generate')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Generate payment invoice (facture)',
    description:
      'Step 6 — Create a payment invoice for a referee. ' +
      'Provide startDate + endDate (ISO YYYY-MM-DD). ' +
      'Optionally pass matchIds[] to use only admin-selected matches; ' +
      'if omitted, all completed matches in the range are used.',
  })
  @ApiBody({ type: GeneratePaymentDto })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate period' })
  generate(@Body() generatePaymentDto: GeneratePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.generatePayment(generatePaymentDto, user.role);
  }

  @Get('preview-matches')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Step 3 — Preview matches for a referee in a date range',
    description:
      'Returns all COMPLETED matches where the referee was designated in [startDate, endDate). ' +
      'Includes per-match payment amounts if already calculated. No DB writes. ' +
      'Admin can use this list to select/deselect matches before creating the invoice.',
  })
  @ApiResponse({ status: 200, description: 'List of matches returned' })
  previewMatches(@Query() dto: PreviewMatchesDto, @CurrentUser() user: any) {
    return this.paymentsService.previewMatches(dto, user.role);
  }

  @Post('preview-total')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Step 5 — Preview total payment for selected matches',
    description:
      'Given a refereeId and a curated list of matchIds (selected by admin), ' +
      'returns the calculated payment breakdown (baseAmount, bonuses, deductions, totalAmount) ' +
      'WITHOUT creating any document. Warnings are returned for matches missing payment records.',
  })
  @ApiBody({ type: PreviewTotalDto })
  @ApiResponse({ status: 200, description: 'Payment preview returned' })
  previewTotal(@Body() dto: PreviewTotalDto, @CurrentUser() user: any) {
    return this.paymentsService.previewTotal(dto, user.role);
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
    summary: 'Get all payments',
    description: 'Retrieve all payments with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of payments retrieved successfully',
  })
  findAll(@Query() filterDto: FilterPaymentsDto, @CurrentUser() user: any) {
    return this.paymentsService.findAll(filterDto, user.role);
  }

  @Get('pending')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Get pending payments',
    description: 'Retrieve all pending payments awaiting validation',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending payments retrieved successfully',
  })
  findPending(@CurrentUser() user: any) {
    return this.paymentsService.findPending(user.role);
  }

  @Get('statistics')
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Get payment statistics',
    description: 'Retrieve payment statistics and analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStatistics(@Query() dto: PaymentStatisticsDto, @CurrentUser() user: any) {
    return this.paymentsService.getStatistics(dto, user.role);
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
    summary: 'Get payments by referee',
    description: 'Retrieve all payments for a specific referee',
  })
  @ApiParam({ name: 'refereeId', description: 'Referee ID' })
  @ApiResponse({
    status: 200,
    description: 'Referee payments retrieved successfully',
  })
  findByReferee(@Param('refereeId') refereeId: string, @CurrentUser() user: any) {
    return this.paymentsService.findByReferee(refereeId, user.role);
  }

  @Get(':id')
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
    summary: 'Get payment by ID',
    description: 'Retrieve a specific payment by ID',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id, user.role);
  }

  @Patch(':id/validate')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Validate payment',
    description: 'Validate a pending payment (role-based validation workflow)',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ type: ValidatePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment validated successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  validate(
    @Param('id') id: string,
    @Body() validatePaymentDto: ValidatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.validate(
      id,
      user.userId,
      user.role,
      validatePaymentDto,
    );
  }

  @Patch(':id/reject')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Reject payment',
    description: 'Reject a pending payment with reason',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ type: RejectPaymentDto })
  @ApiResponse({ status: 200, description: 'Payment rejected successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  reject(
    @Param('id') id: string,
    @Body() rejectPaymentDto: RejectPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.reject(
      id,
      user.userId,
      user.role,
      rejectPaymentDto,
    );
  }

  @Patch(':id/mark-paid')
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA)
  @ApiOperation({
    summary: 'Mark payment as paid',
    description: 'Mark a validated payment as paid',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ type: MarkPaidDto })
  @ApiResponse({
    status: 200,
    description: 'Payment marked as paid successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  markPaid(@Param('id') id: string, @Body() markPaidDto: MarkPaidDto) {
    return this.paymentsService.markPaid(id, markPaidDto);
  }

  @Post('bulk-validate')
  @Roles(
    Role.FINANCE_DNA,
    Role.ADMIN_DNA,
    Role.CAA,
    Role.CAJ,
    Role.CAF,
    Role.CRA,
  )
  @ApiOperation({
    summary: 'Bulk validate payments',
    description: 'Validate multiple payments at once',
  })
  @ApiBody({ type: BulkValidateDto })
  @ApiResponse({ status: 200, description: 'Payments validated successfully' })
  bulkValidate(
    @Body() bulkValidateDto: BulkValidateDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.bulkValidate(
      user.userId,
      user.role,
      bulkValidateDto,
    );
  }


  @Get('pdf/regional')
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({
    summary: 'Generate regional PDF for payment distribution',
    description:
      'PDF with CRA President signature section. Requires startDate and endDate (YYYY-MM-DD).',
  })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  async generateRegionalPDF(
    @Res() res: Response,
    @Query('region') region: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('category') category?: string,
    @Query('presidentName') presidentName?: string,
    @Query('label') label?: string,
  ) {
    const pdf = await this.pdfService.generateRegionalPDF({
      region,
      startDate,
      endDate,
      category,
      presidentName,
      label,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="paiements_${region}_${startDate}_${endDate}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }

  @Get('pdf/consolidated-regional')
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({
    summary: 'Generate consolidated PDF for all categories in a region',
    description: 'Comprehensive regional report with all categories. Requires startDate and endDate (YYYY-MM-DD).',
  })
  @ApiResponse({ status: 200, description: 'Consolidated PDF generated' })
  async generateConsolidatedPDF(
    @Res() res: Response,
    @Query('region') region: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('presidentName') presidentName?: string,
    @Query('label') label?: string,
  ) {
    const pdf = await this.pdfService.generateConsolidatedRegionalPDF(
      region,
      startDate,
      endDate,
      presidentName,
      label,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport_consolide_${region}_${startDate}_${endDate}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }

  @Get('pdf/regions-list')
  @Roles(Role.FINANCE_DNA, Role.ADMIN_DNA, Role.CRA)
  @ApiOperation({
    summary: 'Get list of regions with validated payments',
    description: 'Helper to identify regions needing PDF generation. Requires startDate and endDate (YYYY-MM-DD).',
  })
  @ApiResponse({ status: 200, description: 'Regions list retrieved' })
  getRegionsWithValidatedPayments(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.pdfService.getRegionsWithValidatedPayments(startDate, endDate);
  }
}
