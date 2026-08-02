import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { RFQ } from '../rfqs/entities/rfq.entity';
import { Quotation } from '../rfqs/entities/quotation.entity';
import { Deal } from '../deals/entities/deal.entity';
import { DealMilestone } from '../deals/entities/deal-milestone.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ComplianceChecklist } from '../compliance/entities/compliance-checklist.entity';
import { Product } from '../products/entities/product.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RFQ,
      Quotation,
      Deal,
      DealMilestone,
      Payment,
      Notification,
      ComplianceChecklist,
      Product,
      Organization,
      OrganizationMember,
    ]),
  ],
  providers: [WorkflowService],
  controllers: [WorkflowsController],
  exports: [WorkflowService],
})
export class WorkflowsModule {}
