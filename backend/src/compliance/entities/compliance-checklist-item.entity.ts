import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('compliance_checklist_items')
export class ComplianceChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'checklist_id' })
  checklistId: string;

  @Column({ name: 'rule_id', nullable: true })
  ruleId: string | null;

  @Column({ name: 'requirement_type', type: 'enum', enum: ['document', 'inspection', 'laboratory_test', 'certification', 'registration', 'label', 'permit', 'fee', 'tax'] })
  requirementType: string;

  @Column({ type: 'text' })
  requirement: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'responsible_party', length: 50 })
  responsibleParty: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'document_id', nullable: true })
  documentId: string | null;

  @Column({ name: 'evidence_notes', type: 'text', nullable: true })
  evidenceNotes: string | null;

  @Column({ name: 'completed_by', nullable: true })
  completedBy: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'actual_cost_usd', type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualCostUsd: number | null;

  @Column({ name: 'actual_time_days', type: 'int', nullable: true })
  actualTimeDays: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
