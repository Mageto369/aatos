import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '../deals/entities/deal.entity';

export interface Dispute {
  id: string;
  dealId: string;
  raisedByOrgId: string;
  raisedByUserId: string;
  category: 'quality' | 'quantity' | 'payment' | 'delivery' | 'documentation' | 'other';
  description: string;
  evidence: Array<{ type: string; url: string; description?: string }>;
  status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'closed';
  resolution?: string;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dispute Resolution Service
 * Handles trade dispute filing, evidence collection, and resolution.
 * For pilot: manual mediation. Future: automated rules + arbitration.
 */
@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
  ) {}

  async createDispute(
    dealId: string,
    userId: string,
    orgId: string,
    data: {
      category: Dispute['category'];
      description: string;
      evidence?: Dispute['evidence'];
    },
  ): Promise<Dispute> {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    // Verify user belongs to one of the deal parties
    if (deal.buyerOrgId !== orgId && deal.supplierOrgId !== orgId) {
      throw new ForbiddenException('You are not a party to this deal');
    }

    const dispute: Dispute = {
      id: crypto.randomUUID(),
      dealId,
      raisedByOrgId: orgId,
      raisedByUserId: userId,
      category: data.category,
      description: data.description,
      evidence: data.evidence || [],
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store dispute in deal metadata (pilot: simple approach)
    const disputes = (deal.metadata?.disputes || []) as Dispute[];
    disputes.push(dispute);
    deal.metadata = { ...deal.metadata, disputes };
    await this.dealRepo.save(deal);

    return dispute;
  }

  async getDealDisputes(dealId: string, orgId: string): Promise<Dispute[]> {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    if (deal.buyerOrgId !== orgId && deal.supplierOrgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    return (deal.metadata?.disputes || []) as Dispute[];
  }

  async getAllDisputes(): Promise<Array<Dispute & { deal: Deal }>> {
    const deals = await this.dealRepo.find({
      where: [{ metadata: { disputes: [] } } as any],
    });

    const all: Array<Dispute & { deal: Deal }> = [];
    for (const deal of deals) {
      const disputes = (deal.metadata?.disputes || []) as Dispute[];
      for (const d of disputes) {
        all.push({ ...d, deal });
      }
    }
    return all;
  }

  async updateDispute(
    dealId: string,
    disputeId: string,
    userId: string,
    updates: {
      status?: Dispute['status'];
      resolution?: string;
    },
  ): Promise<Dispute> {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const disputes = (deal.metadata?.disputes || []) as Dispute[];
    const dispute = disputes.find(d => d.id === disputeId);
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (updates.status) dispute.status = updates.status;
    if (updates.resolution) {
      dispute.resolution = updates.resolution;
      dispute.resolvedBy = userId;
    }
    dispute.updatedAt = new Date();

    deal.metadata = { ...deal.metadata, disputes };
    await this.dealRepo.save(deal);

    return dispute;
  }
}
