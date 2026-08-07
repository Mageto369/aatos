import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from '../organizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepo: jest.Mocked<Repository<Organization>>;
  let memberRepo: jest.Mocked<Repository<OrganizationMember>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            })),
            softRemove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    orgRepo = module.get(getRepositoryToken(Organization));
    memberRepo = module.get(getRepositoryToken(OrganizationMember));
  });

  describe('create', () => {
    it('should create organization and add creator as owner', async () => {
      const dto = { name: 'Test Org', type: 'exporter' as const, country: 'KE' };
      const savedOrg = { id: 'org-1', ...dto, slug: 'test-org' } as unknown as Organization;
      orgRepo.findOne.mockResolvedValue(null);
      orgRepo.create.mockReturnValue(savedOrg);
      orgRepo.save.mockResolvedValue(savedOrg);
      memberRepo.create.mockReturnValue({ id: 'member-1' } as OrganizationMember);
      memberRepo.save.mockResolvedValue({ id: 'member-1' } as OrganizationMember);

      const result = await service.create('user-1', dto as any);

      expect(result.id).toBe('org-1');
      expect(memberRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when name exists', async () => {
      const dto = { name: 'Test Org', type: 'exporter', country: 'KE' };
      orgRepo.findOne.mockResolvedValue({ id: 'org-1' } as Organization);

      await expect(service.create('user-1', dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return organization by id', async () => {
      const org = { id: 'org-1', name: 'Test' } as Organization;
      orgRepo.findOne.mockResolvedValue(org);

      const result = await service.findOne('org-1');

      expect(result.id).toBe('org-1');
    });

    it('should throw NotFoundException when missing', async () => {
      orgRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-remove organization', async () => {
      const org = { id: 'org-1' } as Organization;
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.softRemove.mockResolvedValue(org);

      await service.remove('org-1');

      expect(orgRepo.softRemove).toHaveBeenCalledWith(org);
    });
  });
});
