import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

/**
 * One recovery ("backup") code belonging to a user.
 *
 * Only the keyed hash of the code is ever stored — `code_hash` is an
 * HMAC-SHA256 hex digest, so a database dump does not yield usable codes.
 * Single-use is enforced by claiming the row with a conditional UPDATE on
 * `used_at IS NULL` rather than by reading and then writing, so two concurrent
 * logins cannot both spend the same code.
 */
@Entity('user_mfa_recovery_codes')
@Index(['userId'])
@Unique(['userId', 'codeHash'])
export class MfaRecoveryCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', name: 'code_hash', length: 64 })
  codeHash: string;

  @Column({ type: 'timestamptz', name: 'used_at', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
