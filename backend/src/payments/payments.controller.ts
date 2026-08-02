import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
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
  async create(@Body() data: any, @Request() req) {
    return this.paymentsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  async findAll(
    @Query('dealId') dealId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req,
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
