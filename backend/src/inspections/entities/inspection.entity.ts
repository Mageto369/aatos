import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export type InspectionType = 'pre_shipment' | 'loading' | 'discharge' | 'destination' | 'quality' | 'quantity' | 'packaging';
export type InspectionStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

@Entity('inspections')
@Index(['dealId', 'deletedAt'])
@Index(['organizationId', 'deletedAt'])
@Index(['inspectionType', 'deletedAt'])
@Index(['status', 'deletedAt'])
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dealId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  requestedByUserId: string;

  @Column({ type: 'enum', enum: ['pre_shipment', 'loading', 'discharge', 'destination', 'quality', 'quantity', 'packaging'] })
  inspectionType: InspectionType;

  @Column({ type: 'enum', enum: ['requested', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled'], default: 'requested' })
  status: InspectionStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  inspectorName: string;

  @Column({ type: 'uuid', nullable: true })
  inspectorOrganizationId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  inspectionLocation: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  testResults: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  passFailStatus: string;

  @Column({ type: 'uuid', nullable: true })
  reportDocumentId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;
}
