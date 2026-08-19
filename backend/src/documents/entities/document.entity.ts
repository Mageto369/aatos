import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export type DocumentType = 'business_registration' | 'export_license' | 'import_license' | 'phytosanitary_certificate' | 'certificate_of_origin' | 'quality_certificate' | 'organic_certificate' | 'fair_trade_certificate' | 'bank_statement' | 'tax_certificate' | 'identity_document' | 'inspection_report' | 'lab_report' | 'contract' | 'invoice' | 'bill_of_lading' | 'insurance_policy' | 'customs_declaration' | 'packing_list' | 'other';
export type DocumentStatus = 'uploaded' | 'pending_review' | 'verified' | 'rejected' | 'expired' | 'revoked';

@Entity('documents')
@Index(['organizationId'])
@Index(['type'])
@Index(['status'])
@Index(['relatedEntityType', 'relatedEntityId'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'uuid', name: 'uploaded_by_user_id' })
  uploadedByUserId: string;

  @Column({
    type: 'enum',
    enum: ['business_registration', 'export_license', 'import_license', 'phytosanitary_certificate', 'certificate_of_origin', 'quality_certificate', 'organic_certificate', 'fair_trade_certificate', 'bank_statement', 'tax_certificate', 'identity_document', 'inspection_report', 'lab_report', 'contract', 'invoice', 'bill_of_lading', 'insurance_policy', 'customs_declaration', 'packing_list', 'other'],
    name: 'type',
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: ['uploaded', 'pending_review', 'verified', 'rejected', 'expired', 'revoked'],
    default: 'uploaded',
    name: 'status',
  })
  status: DocumentStatus;

  @Column({ type: 'varchar', length: 255, name: 'title' })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({ type: 'bigint', name: 'file_size_bytes' })
  fileSizeBytes: number;

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'varchar', length: 500, name: 'storage_key' })
  storageKey: string;

  @Column({ type: 'varchar', length: 100, default: 'aatos-documents', name: 'storage_bucket' })
  storageBucket: string;

  @Column({ type: 'jsonb', nullable: true, name: 'extracted_data' })
  extractedData: Record<string, any>;

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true, name: 'extraction_confidence' })
  extractionConfidence: number;

  @Column({ type: 'text', nullable: true, name: 'extracted_text' })
  extractedText: string;

  @Column({ type: 'uuid', nullable: true, name: 'verified_by_user_id' })
  verifiedByUserId: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'verification_notes' })
  verificationNotes: string;

  @Column({ type: 'date', nullable: true, name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'issuing_authority' })
  issuingAuthority: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'document_number' })
  documentNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'related_entity_type' })
  relatedEntityType: string;

  @Column({ type: 'uuid', nullable: true, name: 'related_entity_id' })
  relatedEntityId: string;

  @Column({ type: 'text', array: true, nullable: true, name: 'tags' })
  tags: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date;
}
