import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export type NotificationType = 'deal_update' | 'rfq_match' | 'message_received' | 'milestone_completed' | 'document_reviewed' | 'inspection_scheduled' | 'compliance_alert' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

@Entity('notifications')
@Index(['recipientUserId', 'readAt'])
@Index(['recipientUserId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  recipientUserId: string;

  @Column({ type: 'uuid', nullable: true })
  recipientOrgId: string;

  @Column({ type: 'enum', enum: ['deal_update', 'rfq_match', 'message_received', 'milestone_completed', 'document_reviewed', 'inspection_scheduled', 'compliance_alert', 'system'] })
  type: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' })
  priority: NotificationPriority;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actionUrl: string;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dismissedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;
}
