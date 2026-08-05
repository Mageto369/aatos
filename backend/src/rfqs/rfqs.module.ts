import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfqsService } from './rfqs.service';
import { RfqsController } from './rfqs.controller';
import { RFQ } from './entities/rfq.entity';
import { Quotation } from './entities/quotation.entity';

import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [TypeOrmModule.forFeature([RFQ, Quotation]), WorkflowsModule],
  providers: [RfqsService],
  controllers: [RfqsController],
  exports: [RfqsService],
})
export class RfqsModule {}
