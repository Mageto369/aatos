import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductDto, UpdateProductDto, ProductFilters } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
  ) {}

  async create(userId: string, orgId: string, dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId, isActive: true } });
    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    // Validate attributes against category schema
    this.validateAttributes(dto.attributes, category.attributeSchema);

    const product = this.productRepo.create({
      ...dto,
      organizationId: orgId,
      createdByUserId: userId,
      status: 'pending_review',
    });

    return this.productRepo.save(product);
  }

  async findAll(filters: ProductFilters) {
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.organization', 'org')
      .where('p.deletedAt IS NULL')
      .andWhere('p.status = :status', { status: 'published' });

    if (filters.category) {
      qb.andWhere('p.categoryId = :category', { category: filters.category });
    }
    if (filters.country) {
      qb.andWhere('p.originCountry = :country', { country: filters.country });
    }
    if (filters.minPrice) {
      qb.andWhere('p.priceFob >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice) {
      qb.andWhere('p.priceFob <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters.certification) {
      qb.andWhere(':cert = ANY(p.certifications)', { cert: filters.certification });
    }
    if (filters.destination) {
      qb.andWhere(':dest = ANY(p.eligibleCountries)', { dest: filters.destination });
    }
    if (filters.q) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2.where('p.title ILIKE :q', { q: `%${filters.q}%` })
            .orWhere('p.description ILIKE :q', { q: `%${filters.q}%` });
        }),
      );
    }

    const sortField = filters.sort?.startsWith('-') ? filters.sort.slice(1) : filters.sort || 'createdAt';
    const sortOrder = filters.sort?.startsWith('-') ? 'DESC' : 'ASC';
    qb.orderBy(`p.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const limit = Math.min(filters.limit || 20, 100);
    qb.take(limit);

    if (filters.cursor) {
      const [createdAt, id] = Buffer.from(filters.cursor, 'base64').toString().split('::');
      qb.andWhere('(p.createdAt, p.id) < (:createdAt, :id)', { createdAt, id });
    }

    const [items, total] = await qb.getManyAndCount();

    const nextCursor = items.length === limit
      ? Buffer.from(`${items[items.length - 1].createdAt.toISOString()}::${items[items.length - 1].id}`).toString('base64')
      : null;

    return { items, total, nextCursor };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id,  },
      relations: ['organization'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(productId: string, userId: string, orgId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(productId);
    if (product.organizationId !== orgId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(productId: string, orgId: string): Promise<void> {
    const product = await this.findOne(productId);
    if (product.organizationId !== orgId) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }
    await this.productRepo.softRemove(product);
  }

  private validateAttributes(attributes: Record<string, any>, schema: Record<string, any>): void {
    if (!schema || Object.keys(schema).length === 0) return;
    // TODO: Implement JSON Schema validation using ajv
    // For MVP, basic type checking
    for (const [key, value] of Object.entries(attributes)) {
      if (value === null || value === undefined) continue;
      // Add validation logic here
    }
  }
}
