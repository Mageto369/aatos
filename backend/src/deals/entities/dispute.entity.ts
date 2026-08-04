import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface DisputeEvidence {
  id: string;
  type: 'document' | 'photo' | 'video' | 'message';
  url: string;
  description: string;
  uploadedBy: string;
  uploadedAt: Date;
}

@Entity('disputes')
export class DisputeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  dealId: string;

  @Column({ type: 'varchar', length: 100 })
  initiatorId: string;

  @Column({ type: 'varchar', length: 100 })
  respondentId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'open' })
  status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'cancelled';

  @Column({ type: 'varchar', length: 50 })
  type: 'quality' | 'quantity' | 'delivery' | 'payment' | 'other';

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  claimedAmount: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: DisputeEvidence[];

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
