import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { SupplierQualityService } from './supplier-quality.service';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { Deal } from '../deals/entities/deal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationMember, Deal])],
  providers: [OrganizationsService, SupplierQualityService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService, SupplierQualityService],
})
export class OrganizationsModule {}
