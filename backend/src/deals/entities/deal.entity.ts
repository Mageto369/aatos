import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { DealMilestone } from './deal-milestone.entity';

@Entity('deals')
@Index(['buyerOrgId'], { where: '"deletedAt" IS NULL' })
@Index(['supplierOrgId'], { where: '"deletedAt" IS NULL' })
@Index(['status'], { where: '"deletedAt" IS NULL' })
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_org_id' })
  buyerOrgId: string;

  @Column({ name: 'supplier_org_id' })
  supplierOrgId: string;

  @Column({ name: 'rfq_id', nullable: true })
  rfqId: string | null;

  @Column({ name: 'winning_quotation_id', nullable: true })
  winningQuotationId: string | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'product_category_id' })
  productCategoryId: string;

  @Column({ name: 'agreed_quantity', type: 'decimal', precision: 18, scale: 4 })
  agreedQuantity: number;

  @Column({ name: 'quantity_unit', type: 'enum', enum: ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] })
  quantityUnit: string;

  @Column({ name: 'agreed_price', type: 'decimal', precision: 18, scale: 4 })
  agreedPrice: number;

  @Column({ name: 'price_currency', type: 'enum', enum: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'], default: 'USD' })
  priceCurrency: string;

  @Column({ type: 'enum', enum: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] })
  incoterm: string;

  @Column({ name: 'payment_terms', length: 255, nullable: true })
  paymentTerms: string | null;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: Date | null;

  @Column({
    type: 'enum',
    enum: ['negotiating', 'contract_pending', 'contract_signed', 'inspection_scheduled',
      'inspection_passed', 'inspection_failed', 'payment_pending', 'payment_received',
      'shipment_booked', 'in_transit', 'customs_clearance', 'delivered',
      'completed', 'disputed', 'cancelled'],
    default: 'negotiating',
  })
  status: string;

  @Column({ name: 'compliance_checklist_id', nullable: true })
  complianceChecklistId: string | null;

  @Column({ name: 'compliance_status', length: 20, default: 'pending' })
  complianceStatus: string;

  @Column({ name: 'inspection_required', default: true })
  inspectionRequired: boolean;

  @Column({ name: 'payment_method', type: 'enum', enum: ['bank_transfer', 'escrow', 'letter_of_credit', 'documentary_collection', 'advance_payment', 'installment', 'trade_finance'], nullable: true })
  paymentMethod: string | null;

  @Column({ name: 'escrow_id', length: 255, nullable: true })
  escrowId: string | null;

  @Column({ name: 'contract_document_id', nullable: true })
  contractDocumentId: string | null;

  @Column({ name: 'total_value_usd', type: 'decimal', precision: 18, scale: 4, nullable: true })
  totalValueUsd: number | null;

  @Column({ name: 'platform_fee_usd', type: 'decimal', precision: 12, scale: 2, nullable: true })
  platformFeeUsd: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'contract_signed_at', type: 'timestamptz', nullable: true })
  contractSignedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'buyer_org_id' })
  buyer: Organization;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'supplier_org_id' })
  supplier: Organization;

  @OneToMany(() => DealMilestone, (m) => m.deal)
  milestones: DealMilestone[];
}
