import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceRule } from './entities/compliance-rule.entity';
import { ComplianceChecklist } from './entities/compliance-checklist.entity';
import { ComplianceChecklistItem } from './entities/compliance-checklist-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceRule, ComplianceChecklist, ComplianceChecklistItem])],
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
