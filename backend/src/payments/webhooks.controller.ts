import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { FlutterwaveService } from './flutterwave.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly flutterwaveService: FlutterwaveService,
  ) {}

  @Post('flutterwave')
  @ApiOperation({ summary: 'Flutterwave payment webhook' })
  async handleFlutterwaveWebhook(
    @Body() payload: any,
    @Headers('verif-hash') signature: string,
  ) {
    this.logger.log(`Flutterwave webhook received: ${payload.event}`);

    // Verify webhook signature (if configured)
    const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    if (expectedHash && signature !== expectedHash) {
      this.logger.warn('Invalid webhook signature');
      return { status: 'ignored' };
    }

    const event = payload.event;
    const data = payload.data;

    if (!data) {
      return { status: 'no data' };
    }

    const txRef = data.tx_ref;
    const status = data.status;

    switch (event) {
      case 'charge.completed':
      case 'payment.successful':
        if (status === 'successful') {
          await this.paymentsService.handlePaymentSuccess(txRef, {
            transactionId: data.id?.toString(),
            flwRef: data.flw_ref,
            amount: data.amount,
            currency: data.currency,
            chargedAmount: data.charged_amount,
            appFee: data.app_fee,
            paymentType: data.payment_type,
            processorResponse: data.processor_response,
            customerEmail: data.customer?.email,
            customerName: data.customer?.name,
            paidAt: data.created_at,
          });
        } else if (status === 'failed') {
          await this.paymentsService.handlePaymentFailure(txRef, data.processor_response);
        }
        break;

      case 'transfer.completed':
        // Handle payout/escrow release
        await this.paymentsService.handleTransferCompleted(txRef, {
          transferId: data.id?.toString(),
          status: data.status,
          amount: data.amount,
        });
        break;

      case 'charge.failed':
        await this.paymentsService.handlePaymentFailure(txRef, data.processor_response || 'Payment failed');
        break;

      default:
        this.logger.log(`Unhandled Flutterwave event: ${event}`);
    }

    return { status: 'processed' };
  }
}
