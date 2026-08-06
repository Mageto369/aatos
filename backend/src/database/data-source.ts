import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env for CLI use (migrations run outside NestJS bootstrap)
config({ path: join(__dirname, '..', '..', '.env.local') });

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL') || process.env.DATABASE_URL || 'postgresql://aatos:aatos_password@localhost:5432/aatos_dev',
  synchronize: false, // NEVER enable in production; use migrations only
  logging: process.env.NODE_ENV === 'development',
  entities: [join(__dirname, '..', '**', '*.entity.ts')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.ts')],
  migrationsTableName: 'migrations',
});
