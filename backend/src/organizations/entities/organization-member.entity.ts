import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('organization_members')
@Unique(['organizationId', 'userId'])
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'admin', 'operator', 'agent', 'viewer', 'compliance_officer', 'finance_officer', 'logistics_officer', 'support'],
    default: 'viewer',
  })
  role: string;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, boolean>;

  @Column({ name: 'is_primary_contact', default: false })
  isPrimaryContact: boolean;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy: string | null;

  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt: Date | null;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Organization, (org) => org.members)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
