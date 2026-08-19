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

  /**
   * Read one RFQ, applying marketplace visibility.
   *
   * This is a marketplace, so a published public RFQ is meant to be
   * discoverable — suppliers cannot quote on tenders they cannot see. What was
   * wrong is that the where clause was `where: { id,  }` (the same vestigial
   * trailing comma as the inspections incident) and the controller passed no
   * acting organization, so an unpublished draft was readable by anyone.
   *
   * Visible when: you are the buyer who raised it; or it is published, and
   * either public or you are on its invited list.
   */
  async findOne(id: string, actingOrgId?: string): Promise<RFQ> {
    const rfq = await this.rfqRepo.findOne({
      where: { id },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    if (actingOrgId && !this.isVisibleTo(rfq, actingOrgId)) {
      throw new NotFoundException('RFQ not found');
    }
    return rfq;
  }

  async createQuotation(rfqId: string, supplierOrgId: string, userId: string, data: Partial<Quotation>): Promise<Quotation> {
    const rfq = await this.findOne(rfqId);
    if (!['published', 'matching'].includes(rfq.status)) {
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

  /** Marketplace visibility for a single RFQ. */
  private isVisibleTo(rfq: RFQ, orgId: string): boolean {
    if (rfq.buyerOrgId === orgId) return true;
    if (rfq.status === 'draft') return false;
    if (rfq.isPublic) return true;
    return (rfq.invitedSupplierIds ?? []).includes(orgId);
  }

  /**
   * Quotations on an RFQ.
   *
   * The buyer who raised the RFQ sees every quote — that is the point of a
   * tender. A supplier sees only its own. Previously this was
   * `where: { rfqId,  }` with no scoping at all, so any tenant could read
   * competitors' unit prices on a live tender.
   */
  async getQuotations(rfqId: string, actingOrgId?: string) {
    if (actingOrgId) {
      const rfq = await this.findOne(rfqId, actingOrgId);
      const where =
        rfq.buyerOrgId === actingOrgId
          ? { rfqId }
          : { rfqId, supplierOrgId: actingOrgId };
      return this.quotationRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    return this.quotationRepo.find({
      where: { rfqId },
      order: { createdAt: 'DESC' },
    });
  }
}
