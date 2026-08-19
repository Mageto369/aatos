import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Deal } from './deal.entity';
import { decimalTransformer } from '../../common/decimal.transformer';

@Entity('deal_milestones')
export class DealMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'deal_id' })
  dealId: string;

  @Column({ name: 'inspection_id', nullable: true, type: 'uuid' })
  inspectionId: string | null;

  @Column({
    name: 'milestone_type',
    type: 'enum',
    enum: ['contract_signing', 'advance_payment', 'inspection_booking', 'inspection_completion',
      'shipment_booking', 'document_submission', 'main_payment', 'delivery_confirmation',
      'final_payment', 'dispute_resolution'],
  })
  milestoneType: string;

  @Column({ name: 'sequence_order', type: 'int' })
  sequenceOrder: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'failed', 'overdue'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', name: 'completed_by', nullable: true })
  completedBy: string | null;

  @Column({ type: 'varchar', name: 'evidence_document_id', nullable: true })
  evidenceDocumentId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'payment_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true , transformer: decimalTransformer })
  paymentPercentage: number | null;

  @Column({ name: 'payment_amount', type: 'decimal', precision: 18, scale: 4, nullable: true , transformer: decimalTransformer })
  paymentAmount: number | null;

  @Column({ name: 'payment_currency', type: 'enum', enum: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'], nullable: true })
  paymentCurrency: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Deal, (deal) => deal.milestones)
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}
