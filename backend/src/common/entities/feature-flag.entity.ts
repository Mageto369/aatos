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

  @Column({ type: 'simple-array', nullable: true })
  allowedUsers: string[];

  @Column({ type: 'simple-array', nullable: true })
  allowedOrgs: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
