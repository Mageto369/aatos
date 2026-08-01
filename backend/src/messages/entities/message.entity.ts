import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index,
} from 'typeorm';

@Entity('messages')
@Index(['dealId', 'createdAt'], { where: '"deletedAt" IS NULL' })
@Index(['rfqId', 'createdAt'], { where: '"deletedAt" IS NULL' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'deal_id', nullable: true })
  dealId: string | null;

  @Column({ name: 'rfq_id', nullable: true })
  rfqId: string | null;

  @Column({ name: 'sender_org_id' })
  senderOrgId: string;

  @Column({ name: 'sender_user_id' })
  senderUserId: string;

  @Column({
    type: 'enum',
    enum: ['text', 'file', 'quote', 'contract', 'system', 'translation'],
    default: 'text',
  })
  messageType: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'original_language', length: 10, default: 'en' })
  originalLanguage: string;

  @Column({ name: 'translated_content', type: 'jsonb', nullable: true })
  translatedContent: Record<string, string> | null;

  @Column({ name: 'attachment_document_id', nullable: true })
  attachmentDocumentId: string | null;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'edited_at', type: 'timestamptz', nullable: true })
  editedAt: Date | null;

  @Column({ name: 'read_by', type: 'jsonb', default: {} })
  readBy: Record<string, string>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
