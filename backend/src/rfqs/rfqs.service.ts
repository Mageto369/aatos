import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RFQ } from './entities/rfq.entity';
import { Quotation } from './entities/quotation.entity';

@Injectable()
export class RfqsService {
  constructor(
    @InjectRepository(RFQ)
    private readonly rfqRepo: Repository<RFQ>,
    @InjectRepository(Quotation)
    private readonly quotationRepo: Repository<Quotation>,
  ) {}

  async create(userId: string, orgId: string, data: Partial<RFQ>): Promise<RFQ> {
    const rfq = this.rfqRepo.create({
      ...data,
      buyerOrgId: orgId,
      createdByUserId: userId,
      status: 'draft',
    });
    return this.rfqRepo.save(rfq);
  }

  async publish(rfqId: string, orgId: string): Promise<RFQ> {
    const rfq = await this.rfqRepo.findOne({ where: { id: rfqId, buyerOrgId: orgId } });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    rfq.status = 'published';
    rfq.publishedAt = new Date();
    return this.rfqRepo.save(rfq);
  }

  async findAll(filters: any) {
    const qb = this.rfqRepo.createQueryBuilder('r')
      .where('r.deletedAt IS NULL');

    if (filters.orgId) {
      qb.andWhere('r.buyerOrgId = :orgId', { orgId: filters.orgId });
    }
    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    if (filters.category) {
      qb.andWhere('r.productCategoryId = :category', { category: filters.category });
    }

    qb.orderBy('r.createdAt', 'DESC');
    qb.take(Math.min(filters.limit || 20, 100));

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string): Promise<RFQ> {
    const rfq = await this.rfqRepo.findOne({
      where: { id,  },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    return rfq;
  }

  async createQuotation(rfqId: string, supplierOrgId: string, userId: string, data: Partial<Quotation>): Promise<Quotation> {
    const rfq = await this.findOne(rfqId);
    if (rfq.status !== 'published') {
      throw new Error('RFQ is not open for quotations');
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validityDays || 30));

    const quotation = this.quotationRepo.create({
      ...data,
      rfqId,
      supplierOrgId,
      createdByUserId: userId,
      status: 'sent',
      validUntil,
      sentAt: new Date(),
    });

    const saved = await this.quotationRepo.save(quotation);

    // Update RFQ quote count
    rfq.quoteReceivedCount += 1;
    await this.rfqRepo.save(rfq);

    return saved;
  }

  async getQuotations(rfqId: string) {
    return this.quotationRepo.find({
      where: { rfqId,  },
      order: { createdAt: 'DESC' },
    });
  }
}
