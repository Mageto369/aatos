import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { decimalTransformer } from '../../common/decimal.transformer';

export type PaymentMethod = 'bank_transfer' | 'escrow' | 'letter_of_credit' | 'documentary_collection' | 'advance_payment' | 'installment' | 'trade_finance';
export type PaymentStatus = 'pending' | 'held' | 'released' | 'refunded' | 'failed' | 'disputed';

@Entity('payments')
@Index(['dealId'])
@Index(['payerOrgId'])
@Index(['payeeOrgId'])
@Index(['status'])
@Index(['externalReference'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'deal_id' })
  dealId: string;

  @Column({ type: 'uuid', nullable: true, name: 'milestone_id' })
  milestoneId: string;

  @Column({ type: 'uuid', name: 'payer_org_id' })
  payerOrgId: string;

  @Column({ type: 'uuid', name: 'payee_org_id' })
  payeeOrgId: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, name: 'amount' , transformer: decimalTransformer })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KES', 'NGN', 'ETB', 'GHS', 'TZS', 'ZAR', 'UGX', 'RWF', 'ZMW', 'XOF', 'XAF', 'AED', 'SAR', 'INR', 'BRL'],
    default: 'USD',
    name: 'currency',
  })
  currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true, name: 'amount_usd' , transformer: decimalTransformer })
  amountUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true, name: 'exchange_rate' , transformer: decimalTransformer })
  exchangeRate: number;

  @Column({
    type: 'enum',
    enum: ['bank_transfer', 'escrow', 'letter_of_credit', 'documentary_collection', 'advance_payment', 'installment', 'trade_finance'],
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: ['pending', 'held', 'released', 'refunded', 'failed', 'disputed'],
    default: 'pending',
    name: 'status',
  })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'external_provider' })
  externalProvider: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_reference' })
  externalReference: string;

  @Column({ type: 'jsonb', nullable: true, name: 'external_metadata' })
  externalMetadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'release_condition' })
  releaseCondition: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'released_at' })
  releasedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'released_by' })
  releasedBy: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'platform_fee_amount' , transformer: decimalTransformer })
  platformFeeAmount: number;

  @Column({
    type: 'enum',
    enum: ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KES', 'NGN', 'ETB', 'GHS', 'TZS', 'ZAR', 'UGX', 'RWF', 'ZMW', 'XOF', 'XAF', 'AED', 'SAR', 'INR', 'BRL'],
    nullable: true,
    name: 'platform_fee_currency',
  })
  platformFeeCurrency: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'provider_fee_amount' , transformer: decimalTransformer })
  providerFeeAmount: number;

  @Column({
    type: 'enum',
    enum: ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KES', 'NGN', 'ETB', 'GHS', 'TZS', 'ZAR', 'UGX', 'RWF', 'ZMW', 'XOF', 'XAF', 'AED', 'SAR', 'INR', 'BRL'],
    nullable: true,
    name: 'provider_fee_currency',
  })
  providerFeeCurrency: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date;
}
