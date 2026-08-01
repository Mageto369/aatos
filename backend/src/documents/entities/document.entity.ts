import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export type DocumentType = 'contract' | 'invoice' | 'certificate' | 'inspection_report' | 'shipping_doc' | 'compliance_doc' | 'other';
export type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'expired';

@Entity('documents')
@Index(['organizationId', 'deletedAt'])
@Index(['dealId', 'deletedAt'])
@Index(['documentType', 'deletedAt'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  uploadedByUserId: string;

  @Column({ type: 'uuid', nullable: true })
  dealId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['contract', 'invoice', 'certificate', 'inspection_report', 'shipping_doc', 'compliance_doc', 'other'] })
  documentType: DocumentType;

  @Column({ type: 'enum', enum: ['draft', 'pending_review', 'approved', 'rejected', 'expired'], default: 'draft' })
  status: DocumentStatus;

  @Column({ type: 'varchar', length: 500 })
  originalFilename: string;

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSizeBytes: number;

  @Column({ type: 'varchar', length: 500 })
  s3Key: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  s3Url: string;

  @Column({ type: 'varchar', length: 64 })
  checksumSha256: string;

  @Column({ type: 'int', default: 1 })
  versionNumber: number;

  @Column({ type: 'uuid', nullable: true })
  previousVersionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  aiClassification: string;

  @Column({ type: 'jsonb', nullable: true })
  aiExtractedFields: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId: string;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;
}
