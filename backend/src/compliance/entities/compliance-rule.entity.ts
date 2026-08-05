import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('compliance_rules')
export class ComplianceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'origin_country', length: 2 })
  originCountry: string;

  @Column({ name: 'destination_country', length: 2 })
  destinationCountry: string;

  @Column({ type: 'varchar', name: 'product_category_id', nullable: true })
  productCategoryId: string | null;

  @Column({ name: 'requirement_type', type: 'enum', enum: ['document', 'inspection', 'laboratory_test', 'certification', 'registration', 'label', 'permit', 'fee', 'tax'] })
  requirementType: string;

  @Column({ type: 'text' })
  requirement: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'responsible_party', length: 50 })
  responsibleParty: string;

  @Column({ type: 'varchar', name: 'issuing_authority', length: 255, nullable: true })
  issuingAuthority: string | null;

  @Column({ name: 'estimated_time_days', type: 'int', nullable: true })
  estimatedTimeDays: number | null;

  @Column({ name: 'estimated_cost_usd', type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedCostUsd: number | null;

  @Column({ type: 'varchar', name: 'validity_period', length: 50, nullable: true })
  validityPeriod: string | null;

  @Column({ type: 'varchar', name: 'verification_method', length: 255, nullable: true })
  verificationMethod: string | null;

  @Column({ type: 'varchar', name: 'source_url', length: 500, nullable: true })
  sourceUrl: string | null;

  @Column({ type: 'varchar', name: 'source_name', length: 255, nullable: true })
  sourceName: string | null;

  @Column({ name: 'reviewed_at', type: 'date', default: () => 'CURRENT_DATE' })
  reviewedAt: Date;

  @Column({ name: 'rule_status', length: 20, default: 'active' })
  ruleStatus: string;

  @Column({ name: 'rule_version', type: 'int', default: 1 })
  ruleVersion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
