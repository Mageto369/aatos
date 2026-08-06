import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInspectionIdToDealMilestones1722800000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deal_milestones
      ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES inspections(id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_milestones_inspection ON deal_milestones(inspection_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_milestones_inspection`);
    await queryRunner.query(`
      ALTER TABLE deal_milestones
      DROP COLUMN IF EXISTS inspection_id
    `);
  }
}
