import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Real TOTP multi-factor authentication.
 *
 * `users` already carried `mfa_enabled` and `mfa_secret` from the initial
 * schema, but nothing ever wrote a usable secret to them — the service that
 * owned those columns was a simulation that accepted fixed codes. This adds
 * the state a real enrolment needs:
 *
 *   - `mfa_pending_secret` holds the secret of an enrolment that has been
 *     started but not yet proven. Overwriting `mfa_secret` directly would
 *     break an already-enrolled user's authenticator the moment they opened
 *     the re-enrolment screen, even if they never completed it.
 *   - `mfa_last_verified_counter` is the TOTP counter of the last code this
 *     user successfully presented. A code stays valid for its whole 30s step
 *     (plus the drift window), so without this a code observed in transit can
 *     be replayed for up to ~90 seconds. Verification refuses any counter at
 *     or below the stored one, which makes every code strictly single-use.
 *   - `mfa_enrolled_at` / `mfa_recovery_codes_issued_at` are for support and
 *     audit ("when did this account get a second factor?").
 *
 * Recovery codes live in their own table rather than an array column on
 * `users` because "single-use" has to be enforced by the database: claiming a
 * code is one `UPDATE ... WHERE code_hash = $1 AND used_at IS NULL`, which
 * two concurrent requests cannot both win. A read-modify-write over an array
 * column can lose that race and let one code be spent twice.
 *
 * Only hashes are stored; the plaintext codes exist once, in the response
 * that issues them.
 */
export class AddMfaEnrolment1725400000000 implements MigrationInterface {
  name = 'AddMfaEnrolment1725400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS mfa_pending_secret VARCHAR(255),
        ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS mfa_last_verified_counter BIGINT,
        ADD COLUMN IF NOT EXISTS mfa_recovery_codes_issued_at TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_mfa_recovery_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_hash VARCHAR(64) NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // The claim query filters on (user_id, code_hash); unique also stops the
    // same code being issued twice to one user within a batch.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_user_mfa_recovery_codes_user_hash
        ON user_mfa_recovery_codes(user_id, code_hash)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_mfa_recovery_codes_unused
        ON user_mfa_recovery_codes(user_id) WHERE used_at IS NULL
    `);

    // An account whose mfa_enabled is true but has no secret can never satisfy
    // login, and one with a secret but the flag off would silently skip the
    // second factor. Neither is reachable through the service; the constraint
    // makes it unreachable through psql too.
    await queryRunner.query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS chk_users_mfa_enabled_has_secret
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT chk_users_mfa_enabled_has_secret
        CHECK (mfa_enabled = FALSE OR mfa_secret IS NOT NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_mfa_enabled_has_secret
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_mfa_recovery_codes_unused`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_user_mfa_recovery_codes_user_hash`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_mfa_recovery_codes`);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS mfa_recovery_codes_issued_at,
        DROP COLUMN IF EXISTS mfa_last_verified_counter,
        DROP COLUMN IF EXISTS mfa_enrolled_at,
        DROP COLUMN IF EXISTS mfa_pending_secret
    `);
  }
}
