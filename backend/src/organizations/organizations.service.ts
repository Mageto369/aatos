import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as slugify from 'slugify';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationFilters } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto): Promise<Organization> {
    const slug = slugify.default(dto.name, { lower: true, strict: true });
    const existing = await this.orgRepo.findOne({ where: { slug }, withDeleted: true });
    if (existing) {
      throw new ConflictException('Organization with this name already exists');
    }

    const org = this.orgRepo.create({
      ...dto,
      slug,
      status: 'draft',
      verificationLevel: 'none',
    });

    const saved = await this.orgRepo.save(org);

    // Add creator as owner
    const member = this.memberRepo.create({
      organizationId: saved.id,
      userId,
      role: 'owner',
      isPrimaryContact: true,
      joinedAt: new Date(),
    });
    await this.memberRepo.save(member);

    return saved;
  }

  async findAll(filters: OrganizationFilters) {
    const qb = this.orgRepo.createQueryBuilder('o')
      .where('o.deletedAt IS NULL');

    if (filters.type) {
      qb.andWhere('o.type = :type', { type: filters.type });
    }
    if (filters.country) {
      qb.andWhere('o.countryCode = :country', { country: filters.country });
    }
    if (filters.status) {
      qb.andWhere('o.status = :status', { status: filters.status });
    }
    if (filters.verificationLevel) {
      qb.andWhere('o.verificationLevel = :vl', { vl: filters.verificationLevel });
    }
    if (filters.q) {
      qb.andWhere(
        '(o.name ILIKE :q OR o.legalName ILIKE :q OR o.city ILIKE :q)',
        { q: `%${filters.q}%` },
      );
    }
    if (filters.trustScoreMin) {
      qb.andWhere('o.trustScore >= :min', { min: filters.trustScoreMin });
    }

    const sortField = filters.sort?.startsWith('-') ? filters.sort.slice(1) : filters.sort || 'createdAt';
    const sortOrder = filters.sort?.startsWith('-') ? 'DESC' : 'ASC';
    qb.orderBy(`o.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const limit = Math.min(filters.limit || 20, 100);
    qb.take(limit);

    if (filters.cursor) {
      // Cursor-based pagination using createdAt + id
      const [createdAt, id] = Buffer.from(filters.cursor, 'base64').toString().split('::');
      qb.andWhere('(o.createdAt, o.id) < (:createdAt, :id)', { createdAt, id });
    }

    const [items, total] = await qb.getManyAndCount();

    const nextCursor = items.length === limit
      ? Buffer.from(`${items[items.length - 1].createdAt.toISOString()}::${items[items.length - 1].id}`).toString('base64')
      : null;

    return { items, total, nextCursor };
  }

  async findOne(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id, deletedAt: null } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { slug, deletedAt: null } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findOne(id);
    Object.assign(org, dto);
    return this.orgRepo.save(org);
  }

  async remove(id: string): Promise<void> {
    const org = await this.findOne(id);
    await this.orgRepo.softRemove(org);
  }

  async getMembers(organizationId: string) {
    return this.memberRepo.find({
      where: { organizationId, deletedAt: null },
      relations: ['user'],
    });
  }

  async addMember(organizationId: string, userId: string, role: string) {
    const existing = await this.memberRepo.findOne({
      where: { organizationId, userId },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    const member = this.memberRepo.create({
      organizationId,
      userId,
      role,
      joinedAt: new Date(),
    });
    return this.memberRepo.save(member);
  }
}
