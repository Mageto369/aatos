import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Every UPDATE on notifications raised
 * `record "new" has no field "updated_at"`.
 *
 * InitialSchema attaches the shared update_updated_at_column() trigger to a
 * list of tables that includes notifications, but the notifications table was
 * created without an updated_at column. The trigger fires BEFORE UPDATE and
 * assigns NEW.updated_at, which aborts the statement. That broke markRead,
 * markAllRead, and any dismiss that actually matched a row — the whole
 * notifications feature is read-only in practice.
 *
 * Adding the column is the right fix rather than dropping the trigger: every
 * other business table in this schema carries updated_at, the entity is
 * expected to have it, and notifications genuinely do change (read, dismissed).
 */
export class FixNotificationsUpdatedAt1725500000000 implements MigrationInterface {
  name = 'FixNotificationsUpdatedAt1725500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS updated_at`);
  }
}
