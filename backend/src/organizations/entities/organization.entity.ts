import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index, OneToMany,
} from 'typeorm';
import { OrganizationMember } from './organization-member.entity';

@Entity('organizations')
@Index(['slug'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['countryCode'], { where: '"deleted_at" IS NULL' })
@Index(['type'], { where: '"deleted_at" IS NULL' })
@Index(['status'], { where: '"deleted_at" IS NULL' })
@Index(['verificationLevel'], { where: '"deleted_at" IS NULL' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext' })
  name: string;

  @Column({ name: 'legal_name', type: 'citext', nullable: true })
  legalName: string | null;

  @Column({ type: 'citext', unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: ['farmer', 'cooperative', 'aggregator', 'processor', 'manufacturer',
      'exporter', 'trader', 'importer', 'distributor', 'retailer',
      'hospitality', 'government', 'ngo', 'lab', 'inspector', 'certifier',
      'freight_forwarder', 'customs_broker', 'warehouse', 'insurer', 'bank',
      'trade_finance', 'consultant', 'platform_admin'],
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'pending_verification', 'verified', 'suspended', 'rejected', 'inactive'],
    default: 'draft',
  })
  status: string;

  @Column({
    name: 'verification_level',
    type: 'enum',
    enum: ['none', 'email_phone', 'business_registration', 'physical_site', 'banking_verified', 'trade_references', 'fully_verified'],
    default: 'none',
  })
  verificationLevel: string;

  @Column({ name: 'country_code', length: 2 })
  countryCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', name: 'postal_code', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', name: 'registration_number', length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ type: 'varchar', name: 'tax_id', length: 100, nullable: true })
  taxId: string | null;

  @Column({ name: 'year_established', type: 'smallint', nullable: true })
  yearEstablished: number | null;

  @Column({ type: 'varchar', name: 'employee_count', length: 20, nullable: true })
  employeeCount: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'annual_capacity', type: 'decimal', precision: 18, scale: 4, nullable: true })
  annualCapacity: number | null;

  @Column({ name: 'profile_completeness', type: 'smallint', default: 0 })
  profileCompleteness: number;

  @Column({ name: 'risk_score', type: 'smallint', default: 50 })
  riskScore: number;

  @Column({ name: 'trust_score', type: 'smallint', default: 0 })
  trustScore: number;

  @Column({ type: 'varchar', name: 'bank_name', length: 200, nullable: true })
  bankName: string | null;

  @Column({ name: 'bank_account_verified', default: false })
  bankAccountVerified: boolean;

  @Column({ name: 'timezone', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ length: 10, default: 'en' })
  locale: string;

  @Column({ name: 'currency_preference', type: 'enum', enum: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'], default: 'USD' })
  currencyPreference: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members: OrganizationMember[];
}
