import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['actorOrgId', 'createdAt'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: bigint;

  @Column({ name: 'actor_user_id', type: 'varchar', length: 100, nullable: true })
  actorUserId: string;

  @Column({ name: 'actor_org_id', type: 'varchar', length: 100, nullable: true })
  actorOrgId: string;

  @Column({ name: 'actor_ip', type: 'varchar', length: 45, nullable: true })
  actorIp: string;

  @Column({ name: 'actor_user_agent', type: 'text', nullable: true })
  actorUserAgent: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 100 })
  entityId: string;

  @Column({ name: 'previous_state', type: 'jsonb', nullable: true })
  previousState: Record<string, any>;

  @Column({ name: 'new_state', type: 'jsonb', nullable: true })
  newState: Record<string, any>;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
