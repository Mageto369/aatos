import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from './entities/deal.entity';
import { DealMilestone } from './entities/deal-milestone.entity';
import { CreateDealDto, UpdateMilestoneDto } from './dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
    @InjectRepository(DealMilestone)
    private readonly milestoneRepo: Repository<DealMilestone>,
  ) {}

  async create(dto: CreateDealDto): Promise<Deal> {
    const totalValue = dto.agreedQuantity * dto.agreedPrice;
    const platformFee = totalValue * 0.01; // 1% platform fee

    const deal = this.dealRepo.create({
      ...dto,
      status: 'negotiating',
      totalValueUsd: totalValue,
      platformFeeUsd: platformFee,
    });

    const saved = await this.dealRepo.save(deal);

    // Create default milestones
    const milestones = this.buildDefaultMilestones(saved.id, dto.milestones || []);
    await this.milestoneRepo.save(milestones);

    const result = await this.dealRepo.findOne({
      where: { id: saved.id },
      relations: ['milestones', 'buyer', 'supplier'],
    });
    if (!result) throw new Error('Deal not found after creation');
    return result;
  }

  async findAll(filters: any) {
    const qb = this.dealRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.buyer', 'buyer')
      .leftJoinAndSelect('d.supplier', 'supplier')
      .leftJoinAndSelect('d.milestones', 'milestones')
      .where('d.deletedAt IS NULL');

    if (filters.orgId) {
      qb.andWhere('(d.buyerOrgId = :orgId OR d.supplierOrgId = :orgId)', { orgId: filters.orgId });
    }
    if (filters.status) {
      qb.andWhere('d.status = :status', { status: filters.status });
    }

    qb.orderBy('d.createdAt', 'DESC');
    qb.take(Math.min(filters.limit || 20, 100));

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealRepo.findOne({
      where: { id,  },
      relations: ['milestones', 'buyer', 'supplier'],
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    return deal;
  }

  async updateMilestone(dealId: string, milestoneId: string, orgId: string, dto: UpdateMilestoneDto): Promise<DealMilestone> {
    const deal = await this.findOne(dealId);
    if (deal.buyerOrgId !== orgId && deal.supplierOrgId !== orgId) {
      throw new ForbiddenException('Not authorized for this deal');
    }

    const milestone = await this.milestoneRepo.findOne({
      where: { id: milestoneId, dealId },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    Object.assign(milestone, dto);
    if (dto.status === 'completed') {
      milestone.completedAt = new Date();
    }

    return this.milestoneRepo.save(milestone);
  }

  private buildDefaultMilestones(dealId: string, customMilestones: any[]): DealMilestone[] {
    if (customMilestones.length > 0) {
      return customMilestones.map((m, i) =>
        this.milestoneRepo.create({
          dealId,
          milestoneType: m.milestoneType,
          sequenceOrder: m.sequenceOrder || i + 1,
          scheduledDate: m.scheduledDate,
          paymentPercentage: m.paymentPercentage,
          paymentAmount: m.paymentAmount,
          paymentCurrency: m.paymentCurrency,
        }),
      );
    }

    // Default pipeline
    return [
      this.milestoneRepo.create({ dealId, milestoneType: 'contract_signing', sequenceOrder: 1 }),
      this.milestoneRepo.create({ dealId, milestoneType: 'advance_payment', sequenceOrder: 2 }),
      this.milestoneRepo.create({ dealId, milestoneType: 'inspection_completion', sequenceOrder: 3 }),
      this.milestoneRepo.create({ dealId, milestoneType: 'shipment_booking', sequenceOrder: 4 }),
      this.milestoneRepo.create({ dealId, milestoneType: 'main_payment', sequenceOrder: 5 }),
      this.milestoneRepo.create({ dealId, milestoneType: 'delivery_confirmation', sequenceOrder: 6 }),
    ];
  }
}
