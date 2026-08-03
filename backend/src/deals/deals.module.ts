import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { ContractService } from './contract.service';
import { DisputeResolutionService } from './dispute-resolution.service';
import { RefundCancellationService } from './refund-cancellation.service';
import { Deal } from './entities/deal.entity';
import { DealMilestone } from './entities/deal-milestone.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, DealMilestone]), PaymentsModule],
  providers: [DealsService, ContractService, DisputeResolutionService, RefundCancellationService],
  controllers: [DealsController],
  exports: [DealsService, ContractService, DisputeResolutionService, RefundCancellationService],
})
export class DealsModule {}
