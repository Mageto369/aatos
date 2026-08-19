import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { decimalTransformer } from '../../common/decimal.transformer';

@Entity('carbon_footprints')
export class CarbonFootprintEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'org_id' })
  orgId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'deal_id' })
  dealId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', length: 20, name: 'transport_mode' })
  transportMode: string;

  @Column({ type: 'varchar', length: 10 })
  origin: string;

  @Column({ type: 'varchar', length: 10 })
  destination: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'distance_km' , transformer: decimalTransformer })
  distanceKm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'weight_kg' , transformer: decimalTransformer })
  weightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'carbon_kg' , transformer: decimalTransformer })
  carbonKg: number;

  @Column({ type: 'varchar', length: 100, name: 'calculation_method' })
  calculationMethod: string;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;
}
