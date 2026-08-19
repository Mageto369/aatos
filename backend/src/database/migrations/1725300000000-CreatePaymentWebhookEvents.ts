import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Deduplication ledger for payment provider webhooks.
 *
 * Payment providers retry deliveries, so the same event can arrive several
 * times. The unique index on (provider, event_id) turns "have I seen this
 * already?" into a single atomic INSERT ... ON CONFLICT DO NOTHING, which is
 * safe even when two retries land concurrently on different instances.
 */
export class CreatePaymentWebhookEvents1725300000000 implements MigrationInterface {
  name = 'CreatePaymentWebhookEvents1725300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider VARCHAR(50) NOT NULL,
        event_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100),
        tx_ref VARCHAR(255),
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(20) NOT NULL DEFAULT 'received',
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_webhook_events_provider_event
        ON payment_webhook_events(provider, event_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_tx_ref
        ON payment_webhook_events(tx_ref)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_received_at
        ON payment_webhook_events(received_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payment_webhook_events_received_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payment_webhook_events_tx_ref`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_payment_webhook_events_provider_event`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_webhook_events`);
  }
}
