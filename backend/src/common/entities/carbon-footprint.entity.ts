import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('carbon_footprints')
export class CarbonFootprintEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  orgId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dealId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  productId: string;

  @Column({ type: 'varchar', length: 20 })
  transportMode: string;

  @Column({ type: 'varchar', length: 10 })
  origin: string;

  @Column({ type: 'varchar', length: 10 })
  destination: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distanceKm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  carbonKg: number;

  @Column({ type: 'varchar', length: 100 })
  calculationMethod: string;

  @CreateDateColumn()
  calculatedAt: Date;
}
