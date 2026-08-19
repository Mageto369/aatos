import { DataSource } from 'typeorm';

/**
 * Satisfy the MFA enrolment requirement for e2e fixture users.
 *
 * `MfaEnrolmentGuard` is a global guard: once a user holds a privileged role —
 * and creating an organization makes the creator its `owner` — every route
 * except the enrolment ones answers 403 until the user has enrolled in TOTP.
 *
 * The e2e suites need a usable privileged session, not a test of enrolment, so
 * the flag is satisfied in the database rather than driven through the TOTP
 * routes. `jwt.strategy` recomputes the requirement from live rows on every
 * request, so tokens issued before this call start working immediately, and
 * the enrolment routes are rate limited (5 per 15 min per app instance), which
 * a fixture should not be spending.
 *
 * `mfa_secret` has to be non-null because of `chk_users_mfa_enabled_has_secret`.
 * Nothing here ever verifies a code, so a placeholder is enough.
 *
 * The whole thing is skipped when the columns are absent, so the suites do not
 * depend on the MFA feature existing.
 */
export async function satisfyMfaEnrolment(
  dataSource: DataSource,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return;

  const columns = await dataSource.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = 'users' AND column_name = 'mfa_enabled'`,
  );
  if (columns.length === 0) return;

  await dataSource.query(
    `UPDATE users
       SET mfa_enabled = true,
           mfa_secret = COALESCE(mfa_secret, 'e2e-fixture-secret'),
           mfa_enrolled_at = COALESCE(mfa_enrolled_at, NOW())
     WHERE id = ANY($1::uuid[])`,
    [userIds],
  );
}
