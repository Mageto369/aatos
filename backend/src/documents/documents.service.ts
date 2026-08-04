import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
  ) {}

  async create(orgId: string, userId: string, data: Partial<Document>): Promise<Document> {
    const doc = this.docRepo.create({
      ...data,
      organizationId: orgId,
      uploadedByUserId: userId,
      status: 'uploaded',
    });
    return this.docRepo.save(doc);
  }

  async findAll(filters: { orgId: string; dealId?: string; documentType?: string; status?: string; limit?: number; offset?: number }) {
    const qb = this.docRepo.createQueryBuilder('d')
      .where('d.organizationId = :orgId', { orgId: filters.orgId })
      .andWhere('d.deletedAt IS NULL');

    if (filters.dealId) {
      qb.andWhere('d.relatedEntityId = :dealId AND d.relatedEntityType = :relType', {
        dealId: filters.dealId,
        relType: 'deal',
      });
    }
    if (filters.documentType) {
      qb.andWhere('d.type = :type', { type: filters.documentType });
    }
    if (filters.status) {
      qb.andWhere('d.status = :status', { status: filters.status });
    }

    qb.orderBy('d.createdAt', 'DESC');
    qb.take(Math.min(filters.limit || 20, 100));
    qb.skip(filters.offset || 0);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, orgId: string): Promise<Document> {
    const doc = await this.docRepo.findOne({
      where: { id,  },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (doc.organizationId !== orgId) {
      throw new ForbiddenException('Not authorized to access this document');
    }
    return doc;
  }

  async update(id: string, orgId: string, data: Partial<Document>): Promise<Document> {
    const doc = await this.findOne(id, orgId);
    Object.assign(doc, data);
    return this.docRepo.save(doc);
  }

  async remove(id: string, orgId: string): Promise<void> {
    const doc = await this.findOne(id, orgId);
    await this.docRepo.softRemove(doc);
  }
}
