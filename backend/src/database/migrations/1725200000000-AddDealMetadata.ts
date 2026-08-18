import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealMetadata1725200000000 implements MigrationInterface {
  name = 'AddDealMetadata1725200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deals
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deals
      DROP COLUMN IF EXISTS metadata
    `);
  }
}
