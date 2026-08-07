import { Test, TestingModule } from '@nestjs/testing';
import { DealsService } from '../deals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Deal } from '../entities/deal.entity';
import { DealMilestone } from '../entities/deal-milestone.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DealsService', () => {
  let service: DealsService;
  let dealRepo: jest.Mocked<Repository<Deal>>;
  let milestoneRepo: jest.Mocked<Repository<DealMilestone>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        {
          provide: getRepositoryToken(Deal),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            })),
          },
        },
        {
          provide: getRepositoryToken(DealMilestone),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    dealRepo = module.get(getRepositoryToken(Deal));
    milestoneRepo = module.get(getRepositoryToken(DealMilestone));
  });

  describe('create', () => {
    it('should create deal with default milestones', async () => {
      const dto = { agreedQuantity: 100, agreedPrice: 10, buyerOrgId: 'org-1', supplierOrgId: 'org-2' } as any;
      const saved = { id: 'deal-1', ...dto, totalValueUsd: 1000, platformFeeUsd: 10 } as Deal;
      dealRepo.create.mockReturnValue(saved);
      dealRepo.save.mockResolvedValue(saved);
      dealRepo.findOne.mockResolvedValue(saved);
      milestoneRepo.create.mockImplementation((data: any) => ({ ...data, id: 'ms-1' } as DealMilestone));
      milestoneRepo.save.mockResolvedValue([] as any);

      const result = await service.create(dto);

      expect(result.id).toBe('deal-1');
      expect(milestoneRepo.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return deal by id', async () => {
      const deal = { id: 'deal-1', status: 'negotiating' } as Deal;
      dealRepo.findOne.mockResolvedValue(deal);

      const result = await service.findOne('deal-1');

      expect(result.id).toBe('deal-1');
    });

    it('should throw NotFoundException when missing', async () => {
      dealRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone when authorized', async () => {
      const deal = { id: 'deal-1', buyerOrgId: 'org-1', supplierOrgId: 'org-2' } as Deal;
      const milestone = { id: 'ms-1', dealId: 'deal-1', status: 'pending' } as DealMilestone;
      dealRepo.findOne.mockResolvedValue(deal);
      milestoneRepo.findOne.mockResolvedValue(milestone);
      milestoneRepo.save.mockResolvedValue({ ...milestone, status: 'completed' } as DealMilestone);

      const result = await service.updateMilestone('deal-1', 'ms-1', 'org-1', { status: 'completed' } as any);

      expect(result.status).toBe('completed');
    });

    it('should throw ForbiddenException when unauthorized', async () => {
      const deal = { id: 'deal-1', buyerOrgId: 'org-2', supplierOrgId: 'org-3' } as Deal;
      dealRepo.findOne.mockResolvedValue(deal);

      await expect(service.updateMilestone('deal-1', 'ms-1', 'org-1', {} as any)).rejects.toThrow(ForbiddenException);
    });
  });
});
