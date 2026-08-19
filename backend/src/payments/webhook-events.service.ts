import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';

export interface WebhookEventClaim {
  provider: string;
  eventId: string;
  eventType?: string | null;
  txRef?: string | null;
  payload?: Record<string, any>;
}

/**
 * Idempotency ledger for provider webhook deliveries.
 *
 * `claim()` is the whole mechanism: it inserts (provider, event_id) and lets
 * the unique index decide. Winning the insert means this process owns the
 * event and should do the work; losing it means some earlier delivery already
 * did, and this one must be dropped. Doing the check as one statement rather
 * than SELECT-then-INSERT keeps two concurrent retries from both passing.
 */
@Injectable()
export class WebhookEventsService {
  private readonly logger = new Logger(WebhookEventsService.name);

  constructor(
    @InjectRepository(PaymentWebhookEvent)
    private readonly repo: Repository<PaymentWebhookEvent>,
  ) {}

  /**
   * Record the event. Returns true when this caller is the first to see it and
   * should process it, false when it has already been claimed.
   */
  async claim(input: WebhookEventClaim): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(PaymentWebhookEvent)
      .values({
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType ?? null,
        txRef: input.txRef ?? null,
        payload: input.payload ?? {},
        status: 'received',
        receivedAt: new Date(),
      })
      .orIgnore()
      .execute();

    const rows = result?.raw;
    return Array.isArray(rows) ? rows.length > 0 : !!rows;
  }

  /** Mark a claimed event as fully handled. */
  async markProcessed(provider: string, eventId: string): Promise<void> {
    await this.repo.update(
      { provider, eventId },
      { status: 'processed', processedAt: new Date() },
    );
  }

  /**
   * Give up a claim whose processing threw, so the provider's next retry gets
   * to try again instead of being swallowed as a duplicate. Only releases a
   * claim that never reached 'processed'.
   */
  async release(provider: string, eventId: string): Promise<void> {
    try {
      await this.repo.delete({ provider, eventId, status: 'received' });
    } catch (err) {
      this.logger.error(
        `Failed to release webhook claim ${provider}/${eventId}: ${(err as Error).message}`,
      );
    }
  }
}
