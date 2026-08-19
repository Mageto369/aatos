import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export type InspectionType = 'farm' | 'facility' | 'warehouse' | 'packing' | 'port' | 'pre_shipment' | 'destination' | 'loading' | 'discharge' | 'quality' | 'quantity' | 'packaging';
export type InspectionResult = 'pending' | 'pass' | 'fail' | 'conditional' | 'waiver';

@Entity('inspections')
@Index(['dealId'])
@Index(['organizationId'])
@Index(['inspectionType'])
@Index(['result'])
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'deal_id' })
  dealId: string;

  @Column({ type: 'uuid', nullable: true, name: 'product_id' })
  productId: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true, name: 'inspector_org_id' })
  inspectorOrgId: string;

  @Column({ type: 'uuid', nullable: true, name: 'inspector_user_id' })
  inspectorUserId: string;

  @Column({
    type: 'enum',
    enum: ['farm', 'facility', 'warehouse', 'packing', 'port', 'pre_shipment', 'destination'],
    name: 'inspection_type',
  })
  inspectionType: InspectionType;

  @Column({ type: 'date', nullable: true, name: 'scheduled_date' })
  scheduledDate: Date;

  @Column({ type: 'date', nullable: true, name: 'completed_date' })
  completedDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'location' })
  location: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'pass', 'fail', 'conditional', 'waiver'],
    default: 'pending',
    name: 'result',
  })
  result: InspectionResult;

  @Column({ type: 'text', nullable: true, name: 'findings' })
  findings: string;

  @Column({ type: 'text', nullable: true, name: 'corrective_actions' })
  correctiveActions: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true, name: 'quantity_verified' })
  quantityVerified: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'quality_grade' })
  qualityGrade: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'moisture_content' })
  moistureContent: number;

  @Column({ type: 'int', nullable: true, name: 'defect_count' })
  defectCount: number;

  @Column({ type: 'boolean', default: false, name: 'contamination_found' })
  contaminationFound: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'temperature_celsius' })
  temperatureCelsius: number;

  @Column({ type: 'text', array: true, nullable: true, name: 'photos' })
  photos: string[];

  @Column({ type: 'text', array: true, nullable: true, name: 'videos' })
  videos: string[];

  @Column({ type: 'uuid', nullable: true, name: 'report_document_id' })
  reportDocumentId: string;

  @Column({ type: 'boolean', nullable: true, name: 'buyer_accepted' })
  buyerAccepted: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'buyer_accepted_at' })
  buyerAcceptedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'buyer_notes' })
  buyerNotes: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'cost_usd' })
  costUsd: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'paid_by' })
  paidBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date;
}
