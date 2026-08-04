import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment record' })
  async create(@Body() data: any, @Request() req: any) {
    return this.paymentsService.create({ ...data, payerOrgId: req.user.orgId });
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  async findAll(
    @Query('dealId') dealId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any,
  ) {
    return this.paymentsService.findAll({
      dealId,
      payerOrgId: req.user.orgId,
      status,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('deal/:dealId')
  @ApiOperation({ summary: 'Get all payments for a deal' })
  async getDealPayments(@Param('dealId') dealId: string) {
    return this.paymentsService.getDealPayments(dealId);
  }

  @Get('deal/:dealId/summary')
  @ApiOperation({ summary: 'Get payment summary for a deal' })
  async getPaymentSummary(@Param('dealId') dealId: string) {
    return this.paymentsService.getPaymentSummary(dealId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/initiate')
  @ApiOperation({ summary: 'Initiate Flutterwave payment' })
  async initiatePayment(
    @Param('id') id: string,
    @Body('redirectUrl') redirectUrl: string,
    @Request() req: any,
  ) {
    const payment = await this.paymentsService.findOne(id);
    // Authorization: must be payer
    if (payment.payerOrgId !== req.user.orgId) {
      throw new ForbiddenException('Only the payer can initiate payment');
    }
    return this.paymentsService.initiateFlutterwavePayment(id, redirectUrl || 'https://aatos.trade/payment/callback');
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify Flutterwave payment' })
  async verifyPayment(@Param('id') id: string, @Request() req: any) {
    const payment = await this.paymentsService.findOne(id);
    if (payment.payerOrgId !== req.user.orgId) {
      throw new ForbiddenException('Not authorized');
    }
    const success = await this.paymentsService.verifyFlutterwavePayment(id);
    return { verified: success, paymentId: id };
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release held payment to payee' })
  async releasePayment(@Param('id') id: string, @Request() req: any) {
    const payment = await this.paymentsService.findOne(id);
    // Both parties can trigger release based on milestone completion
    if (payment.payerOrgId !== req.user.orgId && payment.payeeOrgId !== req.user.orgId) {
      throw new ForbiddenException('Not authorized for this payment');
    }
    return this.paymentsService.releasePayment(id, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update payment status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body() data: any,
  ) {
    return this.paymentsService.updateStatus(id, status, data);
  }
}
