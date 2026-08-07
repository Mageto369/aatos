import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from '../compliance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComplianceRule } from '../entities/compliance-rule.entity';
import { ComplianceChecklist } from '../entities/compliance-checklist.entity';
import { ComplianceChecklistItem } from '../entities/compliance-checklist-item.entity';
import { Repository } from 'typeorm';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let ruleRepo: jest.Mocked<Repository<ComplianceRule>>;
  let checklistRepo: jest.Mocked<Repository<ComplianceChecklist>>;
  let itemRepo: jest.Mocked<Repository<ComplianceChecklistItem>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: getRepositoryToken(ComplianceRule),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(ComplianceChecklist),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ComplianceChecklistItem),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    ruleRepo = module.get(getRepositoryToken(ComplianceRule));
    checklistRepo = module.get(getRepositoryToken(ComplianceChecklist));
    itemRepo = module.get(getRepositoryToken(ComplianceChecklistItem));
  });

  describe('generateChecklist', () => {
    it('should generate checklist from matching rules', async () => {
      const rules = [
        { id: 'rule-1', requirement: 'Export license', requirementType: 'permit', responsibleParty: 'exporter' },
        { id: 'rule-2', requirement: 'Phytosanitary certificate', requirementType: 'certification', responsibleParty: 'exporter' },
      ] as ComplianceRule[];
      ruleRepo.find.mockResolvedValue(rules);

      const checklist = { id: 'cl-1', entityType: 'deal', entityId: 'deal-1' } as ComplianceChecklist;
      checklistRepo.create.mockReturnValue(checklist);
      checklistRepo.save.mockResolvedValue(checklist);
      checklistRepo.findOne.mockResolvedValue({ ...checklist, items: [] } as ComplianceChecklist);
      itemRepo.create.mockImplementation((data: any) => ({ ...data, id: 'item-1' } as ComplianceChecklistItem));
      itemRepo.save.mockResolvedValue([] as any);

      const result = await service.generateChecklist({
        originCountry: 'KE',
        destinationCountry: 'US',
        entityType: 'deal',
        entityId: 'deal-1',
      });

      expect(result.id).toBe('cl-1');
      expect(itemRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateItemStatus', () => {
    it('should mark item completed with timestamp', async () => {
      const item = { id: 'item-1', checklistId: 'cl-1', status: 'pending' } as ComplianceChecklistItem;
      itemRepo.findOne.mockResolvedValue(item);
      itemRepo.save.mockResolvedValue({ ...item, status: 'completed', completedAt: new Date() } as ComplianceChecklistItem);

      const result = await service.updateItemStatus('cl-1', 'item-1', 'completed');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });
  });
});
