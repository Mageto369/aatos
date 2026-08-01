import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index,
} from 'typeorm';

@Entity('rfqs')
@Index(['buyerOrgId'], { where: '"deletedAt" IS NULL' })
@Index(['status'], { where: '"deletedAt" IS NULL' })
@Index(['destinationCountry'], { where: '"deletedAt" IS NULL' })
export class RFQ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_org_id' })
  buyerOrgId: string;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'product_category_id' })
  productCategoryId: string;

  @Column({ type: 'jsonb', default: {} })
  specifications: Record<string, any>;

  @Column({ name: 'required_quantity', type: 'decimal', precision: 18, scale: 4 })
  requiredQuantity: number;

  @Column({ name: 'required_unit', type: 'enum', enum: ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] })
  requiredUnit: string;

  @Column({ length: 50, nullable: true })
  frequency: string | null;

  @Column({ name: 'destination_country', length: 2 })
  destinationCountry: string;

  @Column({ name: 'destination_city', length: 100, nullable: true })
  destinationCity: string | null;

  @Column({ name: 'delivery_date_start', type: 'date', nullable: true })
  deliveryDateStart: Date | null;

  @Column({ name: 'delivery_date_end', type: 'date', nullable: true })
  deliveryDateEnd: Date | null;

  @Column({ name: 'response_deadline', type: 'timestamptz' })
  responseDeadline: Date;

  @Column({ name: 'target_price', type: 'decimal', precision: 18, scale: 4, nullable: true })
  targetPrice: number | null;

  @Column({ name: 'target_price_currency', type: 'enum', enum: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'], default: 'USD' })
  targetPriceCurrency: string;

  @Column({ name: 'preferred_incoterm', type: 'enum', enum: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'], nullable: true })
  preferredIncoterm: string | null;

  @Column({ name: 'payment_terms', length: 100, nullable: true })
  paymentTerms: string | null;

  @Column({ name: 'required_certifications', type: 'text', array: true, default: [] })
  requiredCertifications: string[];

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'matching', 'reviewing_quotes', 'negotiating', 'awarded', 'expired', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Column({ name: 'matched_supplier_count', type: 'int', default: 0 })
  matchedSupplierCount: number;

  @Column({ name: 'quote_received_count', type: 'int', default: 0 })
  quoteReceivedCount: number;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'invited_supplier_ids', type: 'uuid', array: true, default: [] })
  invitedSupplierIds: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
