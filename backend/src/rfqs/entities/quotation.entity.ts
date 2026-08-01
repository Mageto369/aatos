import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index,
} from 'typeorm';

@Entity('quotations')
@Index(['rfqId'], { where: '"deletedAt" IS NULL' })
@Index(['supplierOrgId'], { where: '"deletedAt" IS NULL' })
@Index(['status'], { where: '"deletedAt" IS NULL' })
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rfq_id' })
  rfqId: string;

  @Column({ name: 'supplier_org_id' })
  supplierOrgId: string;

  @Column({ name: 'product_id', nullable: true })
  productId: string | null;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 4 })
  unitPrice: number;

  @Column({ name: 'price_currency', type: 'enum', enum: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'], default: 'USD' })
  priceCurrency: string;

  @Column({ name: 'price_per_unit', type: 'enum', enum: ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] })
  pricePerUnit: string;

  @Column({ name: 'total_price', type: 'decimal', precision: 18, scale: 4 })
  totalPrice: number;

  @Column({ name: 'quantity_offered', type: 'decimal', precision: 18, scale: 4 })
  quantityOffered: number;

  @Column({ name: 'quantity_unit', type: 'enum', enum: ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] })
  quantityUnit: string;

  @Column({ type: 'enum', enum: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] })
  incoterm: string;

  @Column({ name: 'delivery_time_days', type: 'int', nullable: true })
  deliveryTimeDays: number | null;

  @Column({ name: 'payment_terms', length: 255, nullable: true })
  paymentTerms: string | null;

  @Column({ name: 'validity_days', type: 'int', default: 30 })
  validityDays: number;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: Date | null;

  @Column({ name: 'quality_grade', length: 50, nullable: true })
  qualityGrade: string | null;

  @Column({ name: 'packaging_details', type: 'text', nullable: true })
  packagingDetails: string | null;

  @Column({ type: 'jsonb', default: {} })
  specifications: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['draft', 'sent', 'under_review', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  })
  status: string;

  @Column({ name: 'buyer_notes', type: 'text', nullable: true })
  buyerNotes: string | null;

  @Column({ name: 'supplier_notes', type: 'text', nullable: true })
  supplierNotes: string | null;

  @Column({ name: 'negotiation_round', type: 'int', default: 1 })
  negotiationRound: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
