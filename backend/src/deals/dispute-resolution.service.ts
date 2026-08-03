import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface Dispute {
  id: string;
  dealId: string;
  initiatorId: string;
  respondentId: string;
  type: 'quality' | 'quantity' | 'delivery' | 'payment' | 'other';
  status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'cancelled';
  description: string;
  requestedResolution: string;
  evidence: DisputeEvidence[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeEvidence {
  id: string;
  type: 'document' | 'photo' | 'video' | 'message';
  url: string;
  description: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Dispute Resolution Service
 * Manages dispute filing, evidence collection, and resolution workflow.
 */
@Injectable()
export class DisputeResolutionService {
  private readonly logger = new Logger(DisputeResolutionService.name);

  constructor(
    @InjectRepository('disputes')
    private readonly disputeRepo: Repository<any>,
  ) {}

  async createDispute(data: {
    dealId: string;
    initiatorId: string;
    respondentId: string;
    type: Dispute['type'];
    description: string;
    requestedResolution: string;
  }): Promise<Dispute> {
    const dispute = this.disputeRepo.create({
      ...data,
      status: 'open',
      evidence: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.disputeRepo.save(dispute);
    this.logger.log(`Dispute created: ${saved.id} for deal ${data.dealId}`);
    return saved;
  }

  async addEvidence(disputeId: string, evidence: Omit<DisputeEvidence, 'id' | 'uploadedAt'>): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const newEvidence: DisputeEvidence = {
      ...evidence,
      id: crypto.randomUUID(),
      uploadedAt: new Date(),
    };

    dispute.evidence = [...(dispute.evidence || []), newEvidence];
    dispute.updatedAt = new Date();

    return this.disputeRepo.save(dispute);
  }

  async updateStatus(disputeId: string, status: Dispute['status'], resolution?: string, resolvedBy?: string): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.status = status;
    dispute.updatedAt = new Date();

    if (resolution) {
      dispute.resolution = resolution;
      dispute.resolvedAt = new Date();
      dispute.resolvedBy = resolvedBy;
    }

    this.logger.log(`Dispute ${disputeId} status updated to ${status}`);
    return this.disputeRepo.save(dispute);
  }

  async getDisputesByDeal(dealId: string): Promise<Dispute[]> {
    return this.disputeRepo.find({ where: { dealId }, order: { createdAt: 'DESC' } });
  }

  async getDisputesByOrg(orgId: string): Promise<Dispute[]> {
    return this.disputeRepo.find({
      where: [
        { initiatorId: orgId },
        { respondentId: orgId },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getOpenDisputes(): Promise<Dispute[]> {
    return this.disputeRepo.find({
      where: { status: 'open' },
      order: { createdAt: 'ASC' },
    });
  }

  async getDisputeStats(): Promise<{
    total: number;
    open: number;
    resolved: number;
    escalated: number;
    averageResolutionTime: number;
  }> {
    const [total, open, resolved, escalated] = await Promise.all([
      this.disputeRepo.count(),
      this.disputeRepo.count({ where: { status: 'open' } }),
      this.disputeRepo.count({ where: { status: 'resolved' } }),
      this.disputeRepo.count({ where: { status: 'escalated' } }),
    ]);

    // Calculate average resolution time
    const resolvedDisputes = await this.disputeRepo.find({
      where: { status: 'resolved', resolvedAt: Not(null) },
    });

    const avgResolutionTime = resolvedDisputes.length > 0
      ? resolvedDisputes.reduce((sum: number, d: any) => {
          const days = (d.resolvedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / resolvedDisputes.length
      : 0;

    return {
      total,
      open,
      resolved,
      escalated,
      averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    };
  }
}
