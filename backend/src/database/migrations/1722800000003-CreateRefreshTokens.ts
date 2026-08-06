import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokens1722800000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        ip_address VARCHAR(45),
        user_agent VARCHAR(255),
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token)`);
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_expires`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_token`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
  }
}
