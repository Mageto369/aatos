import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { DisputesController } from './disputes.controller';
import { ReferralsController } from './referrals.controller';
import { ContractService } from './contract.service';
import { DisputeResolutionService } from './dispute-resolution.service';
import { DisputeService } from './dispute.service';
import { RefundCancellationService } from './refund-cancellation.service';
import { LogisticsReferralService } from './logistics-referral.service';
import { InsuranceReferralService } from './insurance-referral.service';
import { TradeFinanceService } from './trade-finance.service';
import { Deal } from './entities/deal.entity';
import { DealMilestone } from './entities/deal-milestone.entity';
import { PaymentsModule } from '../payments/payments.module';

import { DisputeEntity } from './entities/dispute.entity';
import { Payment } from '../payments/entities/payment.entity';

import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, DealMilestone, DisputeEntity, Payment]), PaymentsModule, WorkflowsModule],
  providers: [
    DealsService,
    ContractService,
    DisputeResolutionService,
    DisputeService,
    RefundCancellationService,
    LogisticsReferralService,
    InsuranceReferralService,
    TradeFinanceService,
  ],
  controllers: [DealsController, DisputesController, ReferralsController],
  exports: [
    DealsService,
    ContractService,
    DisputeResolutionService,
    DisputeService,
    RefundCancellationService,
    LogisticsReferralService,
    InsuranceReferralService,
    TradeFinanceService,
  ],
})
export class DealsModule {}
