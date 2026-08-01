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
      status: 'draft',
      versionNumber: 1,
    });
    return this.docRepo.save(doc);
  }

  async findAll(filters: { orgId: string; dealId?: string; documentType?: string; status?: string; limit?: number; offset?: number }) {
    const qb = this.docRepo.createQueryBuilder('d')
      .where('d.organizationId = :orgId', { orgId: filters.orgId })
      .andWhere('d.deletedAt IS NULL');

    if (filters.dealId) {
      qb.andWhere('d.dealId = :dealId', { dealId: filters.dealId });
    }
    if (filters.documentType) {
      qb.andWhere('d.documentType = :type', { type: filters.documentType });
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
      where: { id, deletedAt: null },
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
    doc.updatedAt = new Date();
    return this.docRepo.save(doc);
  }

  async remove(id: string, orgId: string): Promise<void> {
    const doc = await this.findOne(id, orgId);
    await this.docRepo.softRemove(doc);
  }

  async updateS3Url(id: string, orgId: string, s3Url: string, s3Key: string, fileSize: number, checksum: string): Promise<Document> {
    const doc = await this.findOne(id, orgId);
    doc.s3Url = s3Url;
    doc.s3Key = s3Key;
    doc.fileSizeBytes = fileSize;
    doc.checksumSha256 = checksum;
    return this.docRepo.save(doc);
  }
}
