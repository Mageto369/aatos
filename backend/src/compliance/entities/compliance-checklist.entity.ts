import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('compliance_checklists')
export class ComplianceChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'origin_country', length: 2 })
  originCountry: string;

  @Column({ name: 'destination_country', length: 2 })
  destinationCountry: string;

  @Column({ name: 'generated_by_rules', type: 'uuid', array: true, default: [] })
  generatedByRules: string[];

  @Column({ name: 'overall_status', length: 20, default: 'pending' })
  overallStatus: string;

  @Column({ name: 'completion_percent', type: 'smallint', default: 0 })
  completionPercent: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
