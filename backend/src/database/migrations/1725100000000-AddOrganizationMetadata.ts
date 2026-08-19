import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationMetadata1725100000000 implements MigrationInterface {
  name = 'AddOrganizationMetadata1725100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organizations
      DROP COLUMN IF EXISTS metadata
    `);
  }
}
