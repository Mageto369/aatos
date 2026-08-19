import { Entity, UpdateDateColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type NotificationType = 'rfq_match' | 'quote_received' | 'milestone_due' | 'inspection_complete' | 'message_received' | 'deal_update' | 'compliance_alert' | 'system';

@Entity('notifications')
@Index(['recipientUserId', 'createdAt'])
@Index(['recipientUserId', 'isRead'])
@Index(['entityType', 'entityId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'recipient_user_id' })
  recipientUserId: string;

  @Column({ type: 'uuid', nullable: true, name: 'recipient_org_id' })
  recipientOrgId: string;

  @Column({ type: 'varchar', length: 50, name: 'type' })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255, name: 'title' })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'body' })
  body: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'action_url' })
  actionUrl: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'action_type' })
  actionType: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId: string;

  @Column({ type: 'text', array: true, nullable: true, name: 'channels' })
  channels: string[];

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'boolean', default: false, name: 'is_archived' })
  isArchived: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
