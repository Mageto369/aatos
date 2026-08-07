import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { ProductCategory } from '../entities/product-category.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let categoryRepo: jest.Mocked<Repository<ProductCategory>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
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
            softRemove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductCategory),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get(getRepositoryToken(Product));
    categoryRepo = module.get(getRepositoryToken(ProductCategory));
  });

  describe('create', () => {
    it('should create product when category exists', async () => {
      const dto = { categoryId: 'cat-1', title: 'Coffee', origin: 'KE' } as any;
      const category = { id: 'cat-1', name: 'Coffee', isActive: true, attributeSchema: {} } as ProductCategory;
      const product = { id: 'prod-1', ...dto } as Product;
      categoryRepo.findOne.mockResolvedValue(category);
      productRepo.create.mockReturnValue(product);
      productRepo.save.mockResolvedValue(product);

      const result = await service.create('user-1', 'org-1', dto);

      expect(result.id).toBe('prod-1');
    });

    it('should throw NotFoundException when category missing', async () => {
      const dto = { categoryId: 'cat-1', title: 'Coffee' } as any;
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', 'org-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update when user owns product', async () => {
      const product = { id: 'prod-1', organizationId: 'org-1', title: 'Old' } as Product;
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, title: 'New' } as Product);

      const result = await service.update('prod-1', 'user-1', 'org-1', { title: 'New' } as any);

      expect(result.title).toBe('New');
    });

    it('should throw ForbiddenException when user does not own product', async () => {
      const product = { id: 'prod-1', organizationId: 'org-2' } as Product;
      productRepo.findOne.mockResolvedValue(product);

      await expect(service.update('prod-1', 'user-1', 'org-1', {} as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-remove when user owns product', async () => {
      const product = { id: 'prod-1', organizationId: 'org-1' } as Product;
      productRepo.findOne.mockResolvedValue(product);
      productRepo.softRemove.mockResolvedValue(product);

      await service.remove('prod-1', 'org-1');

      expect(productRepo.softRemove).toHaveBeenCalledWith(product);
    });
  });
});
