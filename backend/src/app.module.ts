import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProductsModule } from './products/products.module';
import { RfqsModule } from './rfqs/rfqs.module';
import { DealsModule } from './deals/deals.module';
import { MessagesModule } from './messages/messages.module';
import { ComplianceModule } from './compliance/compliance.module';
import { CommonModule } from './common/common.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(4000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().default('redis://localhost:6379'),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        AWS_S3_BUCKET: Joi.string().default('aatos-documents'),
        AWS_REGION: Joi.string().default('us-east-1'),
      }),
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    OrganizationsModule,
    ProductsModule,
    RfqsModule,
    DealsModule,
    MessagesModule,
    ComplianceModule,
  ],
})
export class AppModule {}
