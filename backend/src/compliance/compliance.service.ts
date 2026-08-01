import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRule } from './entities/compliance-rule.entity';
import { ComplianceChecklist } from './entities/compliance-checklist.entity';
import { ComplianceChecklistItem } from './entities/compliance-checklist-item.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceRule)
    private readonly ruleRepo: Repository<ComplianceRule>,
    @InjectRepository(ComplianceChecklist)
    private readonly checklistRepo: Repository<ComplianceChecklist>,
    @InjectRepository(ComplianceChecklistItem)
    private readonly itemRepo: Repository<ComplianceChecklistItem>,
  ) {}

  async findRules(filters: {
    origin?: string;
    destination?: string;
    category?: string;
    requirementType?: string;
  }) {
    const qb = this.ruleRepo.createQueryBuilder('r')
      .where('r.ruleStatus = :status', { status: 'active' });

    if (filters.origin) {
      qb.andWhere('r.originCountry = :origin', { origin: filters.origin });
    }
    if (filters.destination) {
      qb.andWhere('r.destinationCountry = :destination', { destination: filters.destination });
    }
    if (filters.category) {
      qb.andWhere('r.productCategoryId = :category', { category: filters.category });
    }
    if (filters.requirementType) {
      qb.andWhere('r.requirementType = :type', { type: filters.requirementType });
    }

    return qb.getMany();
  }

  async generateChecklist(data: {
    originCountry: string;
    destinationCountry: string;
    productCategoryId?: string;
    entityType: string;
    entityId: string;
  }): Promise<ComplianceChecklist> {
    // Find applicable rules
    const rules = await this.ruleRepo.find({
      where: {
        originCountry: data.originCountry,
        destinationCountry: data.destinationCountry,
        productCategoryId: data.productCategoryId || null,
        ruleStatus: 'active',
      },
    });

    // Create checklist
    const checklist = this.checklistRepo.create({
      entityType: data.entityType,
      entityId: data.entityId,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      generatedByRules: rules.map((r) => r.id),
      overallStatus: 'pending',
      completionPercent: 0,
    });

    const saved = await this.checklistRepo.save(checklist);

    // Create checklist items
    const items = rules.map((rule) =>
      this.itemRepo.create({
        checklistId: saved.id,
        ruleId: rule.id,
        requirementType: rule.requirementType,
        requirement: rule.requirement,
        description: rule.description,
        responsibleParty: rule.responsibleParty,
        status: 'pending',
      }),
    );

    await this.itemRepo.save(items);

    return this.checklistRepo.findOne({
      where: { id: saved.id },
      relations: ['items'],
    });
  }

  async updateItemStatus(
    checklistId: string,
    itemId: string,
    status: string,
    documentId?: string,
    notes?: string,
  ): Promise<ComplianceChecklistItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, checklistId },
    });

    if (!item) {
      throw new Error('Checklist item not found');
    }

    item.status = status;
    item.documentId = documentId || null;
    item.evidenceNotes = notes || null;

    if (status === 'completed') {
      item.completedAt = new Date();
    }

    return this.itemRepo.save(item);
  }
}
