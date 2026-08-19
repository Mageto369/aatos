import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * A webhook delivery from a payment provider, recorded so the same delivery is
 * only ever acted on once.
 *
 * Providers retry deliveries (Flutterwave retries on any non-2xx and on
 * timeout), so without this table a single `charge.completed` could advance a
 * milestone several times. The unique index on (provider, event_id) is the
 * enforcement point: the insert is the claim, and a losing insert means some
 * other delivery of the same event already did the work.
 *
 * This records provider activity only. AATOS never custodies funds — nothing
 * here moves money.
 *
 * Column names are snake_case and every property maps to one explicitly.
 * TypeORM's default naming strategy does not convert case, so an unmapped
 * property would emit `"eventId"` and fail against `event_id` at runtime.
 */
export type WebhookEventStatus = 'received' | 'processed';

@Entity('payment_webhook_events')
@Index(['provider', 'eventId'], { unique: true })
@Index(['txRef'])
export class PaymentWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Provider that sent the delivery, e.g. 'flutterwave'. */
  @Column({ type: 'varchar', length: 50, name: 'provider' })
  provider: string;

  /** Provider's identifier for the event. Unique per provider. */
  @Column({ type: 'varchar', length: 255, name: 'event_id' })
  eventId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'event_type' })
  eventType: string | null;

  /** Transaction reference the event refers to, when the payload carries one. */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'tx_ref' })
  txRef: string | null;

  @Column({ type: 'jsonb', name: 'payload', default: () => "'{}'::jsonb" })
  payload: Record<string, any>;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'received' })
  status: WebhookEventStatus;

  @Column({ type: 'timestamptz', name: 'received_at', default: () => 'NOW()' })
  receivedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
