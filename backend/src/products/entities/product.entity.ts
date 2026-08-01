import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('products')
@Index(['organizationId'], { where: '"deletedAt" IS NULL' })
@Index(['status'], { where: '"deletedAt" IS NULL' })
@Index(['originCountry'], { where: '"deletedAt" IS NULL' })
@Index(['categoryId'], { where: '"deletedAt" IS NULL' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, nullable: true })
  slug: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, any>;

  @Column({ name: 'origin_country', length: 2 })
  originCountry: string;

  @Column({ name: 'origin_region', length: 100, nullable: true })
  originRegion: string | null;

  @Column({ name: 'available_quantity', type: 'decimal', precision: 18, scale: 4 })
  availableQuantity: number;

  @Column({ name: 'available_unit', type: 'enum', enum: ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] })
  availableUnit: string;

  @Column({ name: 'moq', type: 'decimal', precision: 18, scale: 4, nullable: true })
  moq: number | null;

  @Column({ name: 'price_fob', type: 'decimal', precision: 18, scale: 4, nullable: true })
  priceFob: number | null;

  @Column({ name: 'price_cif', type: 'decimal', precision: 18, scale: 4, nullable: true })
  priceCif: number | null;

  @Column({ name: 'price_unit', type: 'enum', enum: ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'], nullable: true })
  priceUnit: string | null;

  @Column({ name: 'price_currency', type: 'enum', enum: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'], default: 'USD' })
  priceCurrency: string;

  @Column({ name: 'packaging_type', length: 100, nullable: true })
  packagingType: string | null;

  @Column({ name: 'incoterm', type: 'enum', enum: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'], default: 'FOB' })
  incoterm: string;

  @Column({ name: 'quality_grade', length: 50, nullable: true })
  qualityGrade: string | null;

  @Column({ type: 'text', array: true, default: [] })
  certifications: string[];

  @Column({ name: 'eligible_countries', type: 'char', array: true, default: [] })
  eligibleCountries: string[];

  @Column({
    type: 'enum',
    enum: ['draft', 'pending_review', 'published', 'unpublished', 'archived'],
    default: 'draft',
  })
  status: string;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'inquiry_count', type: 'int', default: 0 })
  inquiryCount: number;

  @Column({ name: 'compliance_score', type: 'smallint', default: 0 })
  complianceScore: number;

  @Column({ name: 'primary_image_url', length: 500, nullable: true })
  primaryImageUrl: string | null;

  @Column({ type: 'text', array: true, default: [] })
  imageUrls: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
