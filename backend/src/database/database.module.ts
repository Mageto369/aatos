import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        const synchronize = config.get<boolean>('DATABASE_SYNCHRONIZE', false);

        if (isProduction && synchronize) {
          throw new Error(
            'FATAL: DATABASE_SYNCHRONIZE is enabled in production. ' +
            'This would auto-modify the database schema and risk data loss. ' +
            'Disable synchronize and use migrations only.',
          );
        }

        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: synchronize,
          migrationsRun: config.get('NODE_ENV') === 'production',
          logging: config.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
          ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
          maxQueryExecutionTime: 1000,
          extra: {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
