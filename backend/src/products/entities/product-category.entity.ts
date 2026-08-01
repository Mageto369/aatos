import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null;

  @Column({
    name: 'group_type',
    type: 'enum',
    enum: ['beverage_crops', 'fresh_produce', 'dry_commodities', 'spices_botanicals', 'animal_products', 'seafood', 'processed_products', 'other'],
  })
  groupType: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'hs_code', length: 20, nullable: true })
  hsCode: string | null;

  @Column({ name: 'attribute_schema', type: 'jsonb', default: {} })
  attributeSchema: Record<string, any>;

  @Column({ name: 'default_compliance_rules', type: 'jsonb', default: [] })
  defaultComplianceRules: any[];

  @Column({ name: 'icon_url', length: 500, nullable: true })
  iconUrl: string | null;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
