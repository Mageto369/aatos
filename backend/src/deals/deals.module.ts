import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { Deal } from './entities/deal.entity';
import { DealMilestone } from './entities/deal-milestone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, DealMilestone])],
  providers: [DealsService],
  controllers: [DealsController],
})
export class DealsModule {}
