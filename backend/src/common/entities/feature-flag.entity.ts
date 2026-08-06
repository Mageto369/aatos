import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('feature_flags')
export class FeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  type: 'boolean' | 'percentage' | 'user_segment';

  @Column({ type: 'int', nullable: true })
  percentage: number;

  @Column({ type: 'text', nullable: true, name: 'allowed_users' })
  allowedUsers: string;

  @Column({ type: 'text', nullable: true, name: 'allowed_orgs' })
  allowedOrgs: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
