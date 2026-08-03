import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  recipientId: string;

  @Column({ type: 'varchar', length: 100 })
  orgId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50 })
  priority: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'varchar', length: 50 })
  status: 'pending' | 'sent' | 'failed' | 'delivered';

  @Column({ type: 'varchar', length: 100, nullable: true })
  relatedId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedType: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
}
