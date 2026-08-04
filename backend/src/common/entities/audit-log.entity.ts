import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['actorOrgId', 'createdAt'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: bigint;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actorUserId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actorOrgId: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  actorIp: string;

  @Column({ type: 'text', nullable: true })
  actorUserAgent: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'varchar', length: 100 })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  previousState: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newState: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  changeSummary: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  requestId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;
}
