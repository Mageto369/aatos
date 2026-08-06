import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'org_id' })
  orgId: string;

  @Column({ type: 'varchar', length: 50, name: 'tier_id' })
  tierId: string;

  @Column({ type: 'varchar', length: 20, default: 'trialing', name: 'status' })
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';

  @Column({ type: 'timestamptz', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'end_date' })
  endDate: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'trial_ends_at' })
  trialEndsAt: Date;

  @Column({ type: 'boolean', default: true, name: 'auto_renew' })
  autoRenew: boolean;

  @Column({ type: 'varchar', length: 20, default: 'monthly', name: 'billing_cycle' })
  billingCycle: 'monthly' | 'annual';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
