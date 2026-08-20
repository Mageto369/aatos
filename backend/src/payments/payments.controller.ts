import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentsService } from './payments.service';

/**
 * A payment belongs to exactly two organizations: the payer and the payee.
 * These handlers took an id from the path with no request, so any
 * authenticated user could read another company's payment — and, on
 * PATCH :id/status, move it between states. @Roles only asserted the caller
 * held a finance role somewhere, not that the payment was theirs.
 */
function assertPartyToPayment(req: any, payment: { payerOrgId?: string; payeeOrgId?: string }): void {
  const orgId = req?.user?.orgId;
  if (req?.user?.role === 'platform_admin') return;
  if (!orgId || (payment.payerOrgId !== orgId && payment.payeeOrgId !== orgId)) {
    // 404 rather than 403: a stranger should not learn the payment exists.
    throw new NotFoundException('Payment not found');
  }
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment record' })
  @Roles('owner', 'admin', 'finance_officer')
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
  async getDealPayments(@Param('dealId') dealId: string, @Request() req: any) {
    if (!(await this.paymentsService.isPartyToDeal(dealId, req?.user?.orgId))) {
      throw new NotFoundException('Deal not found');
    }
    return this.paymentsService.getDealPayments(dealId);
  }

  @Get('deal/:dealId/summary')
  @ApiOperation({ summary: 'Get payment summary for a deal' })
  async getPaymentSummary(@Param('dealId') dealId: string, @Request() req: any) {
    if (!(await this.paymentsService.isPartyToDeal(dealId, req?.user?.orgId))) {
      throw new NotFoundException('Deal not found');
    }
    return this.paymentsService.getPaymentSummary(dealId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const payment = await this.paymentsService.findOne(id);
    assertPartyToPayment(req, payment);
    return payment;
  }

  @Post(':id/initiate')
  @ApiOperation({ summary: 'Initiate Flutterwave payment' })
  @Roles('owner', 'admin', 'finance_officer')
  async initiatePayment(
    @Param('id') id: string,
    @Body('redirectUrl') redirectUrl: string,
    @Request() req: any,
  ) {
    const payment = await this.paymentsService.findOne(id);
    if (payment.payerOrgId !== req.user.orgId) {
      throw new ForbiddenException('Only the payer can initiate payment');
    }
    return this.paymentsService.initiateFlutterwavePayment(id, redirectUrl || 'https://aatos.trade/payment/callback');
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify Flutterwave payment' })
  @Roles('owner', 'admin', 'finance_officer')
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
  @Roles('owner', 'admin', 'finance_officer')
  async releasePayment(@Param('id') id: string, @Request() req: any) {
    const payment = await this.paymentsService.findOne(id);
    if (payment.payerOrgId !== req.user.orgId && payment.payeeOrgId !== req.user.orgId) {
      throw new ForbiddenException('Not authorized for this payment');
    }
    return this.paymentsService.releasePayment(id, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update payment status' })
  @Roles('owner', 'admin', 'finance_officer')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    assertPartyToPayment(req, await this.paymentsService.findOne(id));
    return this.paymentsService.updateStatus(id, status, data);
  }
}
