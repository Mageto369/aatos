import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection } from './entities/inspection.entity';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(Inspection)
    private readonly inspectionRepo: Repository<Inspection>,
  ) {}

  async create(orgId: string, userId: string, data: Partial<Inspection>): Promise<Inspection> {
    const inspection = this.inspectionRepo.create({
      ...data,
      organizationId: orgId,
      inspectorUserId: userId,
      result: 'pending',
    });
    return this.inspectionRepo.save(inspection);
  }

  async findAll(filters: { orgId: string; dealId?: string; status?: string; type?: string; limit?: number; offset?: number }) {
    const qb = this.inspectionRepo.createQueryBuilder('i')
      .where('i.organizationId = :orgId', { orgId: filters.orgId })
      .andWhere('i.deletedAt IS NULL');

    if (filters.dealId) {
      qb.andWhere('i.dealId = :dealId', { dealId: filters.dealId });
    }
    if (filters.status) {
      qb.andWhere('i.result = :status', { status: filters.status });
    }
    if (filters.type) {
      qb.andWhere('i.inspectionType = :type', { type: filters.type });
    }

    qb.orderBy('i.createdAt', 'DESC');
    qb.take(Math.min(filters.limit || 20, 100));
    qb.skip(filters.offset || 0);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, orgId: string): Promise<Inspection> {
    const inspection = await this.inspectionRepo.findOne({
      where: { id, deletedAt: null },
    });
    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }
    return inspection;
  }

  async updateStatus(id: string, orgId: string, result: string, data?: Partial<Inspection>): Promise<Inspection> {
    const inspection = await this.findOne(id, orgId);
    inspection.result = result as any;
    if (result === 'pass' || result === 'fail' || result === 'conditional') {
      inspection.completedDate = new Date();
    }
    if (data) {
      Object.assign(inspection, data);
    }
    return this.inspectionRepo.save(inspection);
  }

  async remove(id: string, orgId: string): Promise<void> {
    const inspection = await this.findOne(id, orgId);
    await this.inspectionRepo.softRemove(inspection);
  }
}
