import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix schema drift: RFQ entity columns missing from initial migration
 * 
 * Adds:
 * - quote_received_count (int, default 0)
 * - is_public (boolean, default true)
 * - invited_supplier_ids (uuid array, default empty)
 */
export class FixSchemaDriftRfq1722800000001 implements MigrationInterface {
  name = 'FixSchemaDriftRfq1722800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE rfqs 
      ADD COLUMN IF NOT EXISTS quote_received_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS invited_supplier_ids UUID[] NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE rfqs 
      DROP COLUMN IF EXISTS quote_received_count,
      DROP COLUMN IF EXISTS is_public,
      DROP COLUMN IF EXISTS invited_supplier_ids
    `);
  }
}
