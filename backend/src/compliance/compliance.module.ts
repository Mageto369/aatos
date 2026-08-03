import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { VerificationFlowService } from './verification-flow.service';
import { SanctionsScreeningService } from './sanctions-screening.service';
import { CertificateExpirationService } from './certificate-expiration.service';
import { ComplianceRule } from './entities/compliance-rule.entity';
import { ComplianceChecklist } from './entities/compliance-checklist.entity';
import { ComplianceChecklistItem } from './entities/compliance-checklist-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceRule, ComplianceChecklist, ComplianceChecklistItem])],
  providers: [ComplianceService, VerificationFlowService, SanctionsScreeningService, CertificateExpirationService],
  controllers: [ComplianceController],
  exports: [ComplianceService, VerificationFlowService, SanctionsScreeningService, CertificateExpirationService],
})
export class ComplianceModule {}
