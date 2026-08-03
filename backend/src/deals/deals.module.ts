import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { ContractService } from './contract.service';
import { Deal } from './entities/deal.entity';
import { DealMilestone } from './entities/deal-milestone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, DealMilestone])],
  providers: [DealsService, ContractService],
  controllers: [DealsController],
  exports: [DealsService, ContractService],
})
export class DealsModule {}
