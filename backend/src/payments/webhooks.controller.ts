import {
  Controller,
  Post,
  Body,
  Headers,
  Ip,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { FlutterwaveService, WebhookRejectionReason } from './flutterwave.service';
import { WebhookEventsService } from './webhook-events.service';
import { Public } from '../auth/decorators/public.decorator';

const PROVIDER = 'flutterwave';

/**
 * Payment provider callbacks.
 *
 * This controller is @Public() because a payment provider cannot present a
 * JWT. That makes the request signature the *only* authentication on a route
 * that advances payment state, so nothing here runs before the signature is
 * verified — not a lookup, not a write, not even a debug log of the payload.
 *
 * These are milestone records of what a licensed provider did. AATOS never
 * custodies funds; no handler here moves money.
 */
@ApiTags('Webhooks')
@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly webhookEvents: WebhookEventsService,
  ) {}

  @Post('flutterwave')
  @ApiOperation({ summary: 'Flutterwave payment webhook (authenticated by verif-hash signature)' })
  @ApiResponse({ status: 201, description: 'Event processed, or recognised as an already-processed duplicate' })
  @ApiResponse({ status: 401, description: 'verif-hash header missing or does not match the configured secret' })
  @ApiResponse({ status: 503, description: 'Webhook verification is not configured on this instance' })
  async handleFlutterwaveWebhook(
    @Body() payload: any,
    @Headers('verif-hash') signature: string,
    @Ip() ip: string,
  ) {
    // 1. Authenticate before anything else.
    const check = this.flutterwaveService.verifyWebhookSignature(signature);
    if (!check.valid) {
      this.reject(check.reason, payload, signature, ip);
    }

    const eventType: string = payload?.event ?? payload?.['event.type'] ?? 'unknown';
    const data = payload?.data;
    const txRef: string | null = data?.tx_ref ?? data?.reference ?? null;

    if (!data) {
      this.logger.warn(`Flutterwave webhook '${eventType}' carried no data object; ignoring. ip=${ip}`);
      return { status: 'ignored', reason: 'no data' };
    }

    // 2. Claim the event. Losing the claim means a previous delivery already
    //    did this work — providers retry, and replaying a milestone advance is
    //    exactly the bug this prevents.
    const eventId = this.flutterwaveService.resolveWebhookEventId(payload);
    const claimed = await this.webhookEvents.claim({
      provider: PROVIDER,
      eventId,
      eventType,
      txRef,
      payload,
    });

    if (!claimed) {
      this.logger.log(
        `Flutterwave webhook duplicate ignored: event=${eventType} eventId=${eventId} txRef=${txRef ?? 'none'}`,
      );
      return { status: 'duplicate', eventId };
    }

    // 3. Process exactly once. If this throws, drop the claim so the
    //    provider's next retry is not swallowed as a duplicate.
    try {
      await this.process(eventType, txRef, data);
    } catch (err) {
      await this.webhookEvents.release(PROVIDER, eventId);
      this.logger.error(
        `Flutterwave webhook processing failed: event=${eventType} eventId=${eventId} ` +
          `txRef=${txRef ?? 'none'}: ${(err as Error).message}`,
      );
      throw err;
    }

    await this.webhookEvents.markProcessed(PROVIDER, eventId);
    this.logger.log(`Flutterwave webhook processed: event=${eventType} eventId=${eventId}`);
    return { status: 'processed', eventId };
  }

  /**
   * Log enough for an operator to investigate a rejected delivery — what was
   * wrong, where it came from, what it claimed to be — and then refuse it.
   * Never logs the configured secret, and never logs the presented header
   * value either; its presence and length are all that is diagnostic.
   */
  private reject(
    reason: WebhookRejectionReason,
    payload: any,
    signature: string | undefined,
    ip: string,
  ): never {
    const eventType = payload?.event ?? payload?.['event.type'] ?? 'unknown';
    const txRef = payload?.data?.tx_ref ?? payload?.data?.reference ?? 'none';
    const sig = signature ? `present(len=${signature.length})` : 'absent';
    const context =
      `reason=${reason} ip=${ip ?? 'unknown'} verif-hash=${sig} ` +
      `event=${eventType} txRef=${txRef}`;

    if (reason === 'secret_not_configured') {
      // Refusing rather than accepting: an unverifiable webhook is an
      // unauthenticated write to payment state. In production the app will not
      // even boot without the hash (see FlutterwaveService constructor).
      this.logger.error(
        `Flutterwave webhook refused — FLUTTERWAVE_WEBHOOK_HASH is not configured, ` +
          `so no delivery can be authenticated. ${context}`,
      );
      throw new ServiceUnavailableException('Webhook verification is not configured');
    }

    this.logger.warn(`Flutterwave webhook rejected — ${context}`);
    throw new UnauthorizedException('Invalid webhook signature');
  }

  private async process(event: string, txRef: string | null, data: any): Promise<void> {
    const status = data.status;

    switch (event) {
      case 'charge.completed':
      case 'payment.successful':
        if (!txRef) return;
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
        // Records a payout the provider made. AATOS holds no funds to release.
        if (!txRef) return;
        await this.paymentsService.handleTransferCompleted(txRef, {
          transferId: data.id?.toString(),
          status: data.status,
          amount: data.amount,
        });
        break;

      case 'charge.failed':
        if (!txRef) return;
        await this.paymentsService.handlePaymentFailure(
          txRef,
          data.processor_response || 'Payment failed',
        );
        break;

      default:
        this.logger.log(`Unhandled Flutterwave event: ${event}`);
    }
  }
}
