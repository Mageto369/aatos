import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Deal } from '../deals/entities/deal.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { RFQ } from '../rfqs/entities/rfq.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, Organization, RFQ])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
