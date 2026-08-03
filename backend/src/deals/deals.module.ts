import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { ReferralsController } from './referrals.controller';
import { ContractService } from './contract.service';
import { DisputeResolutionService } from './dispute-resolution.service';
import { RefundCancellationService } from './refund-cancellation.service';
import { LogisticsReferralService } from './logistics-referral.service';
import { InsuranceReferralService } from './insurance-referral.service';
import { TradeFinanceService } from './trade-finance.service';
import { Deal } from './entities/deal.entity';
import { DealMilestone } from './entities/deal-milestone.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, DealMilestone]), PaymentsModule],
  providers: [
    DealsService,
    ContractService,
    DisputeResolutionService,
    RefundCancellationService,
    LogisticsReferralService,
    InsuranceReferralService,
    TradeFinanceService,
  ],
  controllers: [DealsController, ReferralsController],
  exports: [
    DealsService,
    ContractService,
    DisputeResolutionService,
    RefundCancellationService,
    LogisticsReferralService,
    InsuranceReferralService,
    TradeFinanceService,
  ],
})
export class DealsModule {}
