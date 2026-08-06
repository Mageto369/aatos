import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webhooks')
export class WebhookEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'org_id' })
  orgId: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 255 })
  secret: string;

  @Column({ type: 'text' })
  events: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_delivered_at' })
  lastDeliveredAt: Date;

  @Column({ type: 'int', default: 0, name: 'delivery_attempts' })
  deliveryAttempts: number;

  @Column({ type: 'int', default: 0, name: 'failed_attempts' })
  failedAttempts: number;
}
