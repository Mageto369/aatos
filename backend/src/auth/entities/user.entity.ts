import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index,
} from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['status'], { where: '"deleted_at" IS NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true })
  email: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  phone: string | null;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', name: 'display_name', length: 200, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string | null;

  /**
   * select: false. A relation load — `relations: ['user']` — pulls every
   * selected column, and one such load on the organization members route
   * handed the live bcrypt hash and the TOTP secret of every member of every
   * organization to any caller holding any valid token. Marking the secrets
   * unselected means a query has to name them to get them, so the default for
   * anything that merely joins a user is to leave them behind.
   *
   * Loading them deliberately: SECRET_COLUMNS below.
   */
  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  /** AES-256-GCM envelope around the base32 TOTP secret; never plaintext. */
  @Column({ type: 'varchar', name: 'mfa_secret', length: 255, nullable: true, select: false })
  mfaSecret: string | null;

  /**
   * Secret for an enrolment that has been started but not yet proven. Kept
   * apart from mfaSecret so opening the enrolment screen cannot break the
   * authenticator that currently works.
   */
  @Column({ type: 'varchar', name: 'mfa_pending_secret', length: 255, nullable: true, select: false })
  mfaPendingSecret: string | null;

  @Column({ name: 'mfa_enrolled_at', type: 'timestamptz', nullable: true })
  mfaEnrolledAt: Date | null;

  /**
   * TOTP counter of the last code accepted for this account. Verification
   * refuses anything at or below it, which makes each code single-use instead
   * of replayable for the length of its step plus the drift window.
   *
   * bigint, so TypeORM hands it back as a string.
   */
  @Column({ name: 'mfa_last_verified_counter', type: 'bigint', nullable: true, select: false })
  mfaLastVerifiedCounter: string | null;

  @Column({ name: 'mfa_recovery_codes_issued_at', type: 'timestamptz', nullable: true })
  mfaRecoveryCodesIssuedAt: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'login_count', type: 'int', default: 0 })
  loginCount: number;

  @Column({ name: 'failed_login_count', type: 'int', default: 0 })
  failedLoginCount: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'suspended', 'invited'], default: 'invited' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}

/**
 * The columns marked `select: false` above. A query that needs them must name
 * them; this is the list, so the set stays in one place and a new secret
 * column does not get silently forgotten by half the call sites.
 */
export const SECRET_COLUMNS = [
  'passwordHash',
  'mfaSecret',
  'mfaPendingSecret',
  'mfaLastVerifiedCounter',
] as const;

/**
 * Load a user with the unselected secret columns included.
 *
 * Authentication and MFA genuinely need them; nothing else does. Going
 * through one helper keeps the deliberate loads countable — grep for it and
 * every place that touches a password hash or a TOTP secret is listed.
 */
export async function findUserWithSecrets(
  repo: import('typeorm').Repository<User>,
  where: import('typeorm').FindOptionsWhere<User>,
): Promise<User | null> {
  const qb = repo.createQueryBuilder('user').where(where);
  for (const column of SECRET_COLUMNS) qb.addSelect(`user.${column}`);
  return qb.getOne();
}
