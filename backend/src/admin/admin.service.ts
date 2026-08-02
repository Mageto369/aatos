import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Deal } from '../deals/entities/deal.entity';
import { RFQ } from '../rfqs/entities/rfq.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
    @InjectRepository(RFQ)
    private readonly rfqRepo: Repository<RFQ>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async getPlatformStats() {
    const [
      totalUsers,
      totalOrgs,
      totalDeals,
      totalRfqs,
      totalPayments,
      activeDeals,
      completedDeals,
    ] = await Promise.all([
      this.userRepo.count({ where: { deletedAt: null } }),
      this.orgRepo.count({ where: { deletedAt: null } }),
      this.dealRepo.count({ where: { deletedAt: null } }),
      this.rfqRepo.count({ where: { deletedAt: null } }),
      this.paymentRepo.count({ where: { deletedAt: null } }),
      this.dealRepo.count({ where: { status: 'active', deletedAt: null } }),
      this.dealRepo.count({ where: { status: 'completed', deletedAt: null } }),
    ]);

    const totalVolume = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'released' })
      .andWhere('p.deletedAt IS NULL')
      .select('COALESCE(SUM(p.amount_usd), 0)', 'total')
      .getRawOne();

    const platformFees = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'released' })
      .andWhere('p.deletedAt IS NULL')
      .select('COALESCE(SUM(p.platform_fee_amount), 0)', 'total')
      .getRawOne();

    return {
      users: { total: totalUsers },
      organizations: { total: totalOrgs },
      deals: { total: totalDeals, active: activeDeals, completed: completedDeals },
      rfqs: { total: totalRfqs },
      payments: { total: totalPayments },
      volume: { totalUsd: Number(totalVolume?.total || 0) },
      platformFees: { totalUsd: Number(platformFees?.total || 0) },
    };
  }

  async getRecentActivity(limit: number = 20) {
    const [recentDeals, recentRfqs, recentUsers] = await Promise.all([
      this.dealRepo.find({
        where: { deletedAt: null },
        order: { createdAt: 'DESC' },
        take: limit,
        relations: ['buyer', 'supplier'],
      }),
      this.rfqRepo.find({
        where: { deletedAt: null },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.userRepo.find({
        where: { deletedAt: null },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);

    return {
      deals: recentDeals,
      rfqs: recentRfqs,
      users: recentUsers,
    };
  }

  async getOrganizations(filters: { status?: string; verificationLevel?: string; type?: string; limit?: number; offset?: number }) {
    const qb = this.orgRepo.createQueryBuilder('o')
      .where('o.deletedAt IS NULL');

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.verificationLevel) qb.andWhere('o.verificationLevel = :level', { level: filters.verificationLevel });
    if (filters.type) qb.andWhere('o.type = :type', { type: filters.type });

    qb.orderBy('o.createdAt', 'DESC');
    qb.take(Math.min(filters.limit || 20, 100));
    qb.skip(filters.offset || 0);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getUsers(filters: { limit?: number; offset?: number }) {
    const qb = this.userRepo.createQueryBuilder('u')
      .where('u.deletedAt IS NULL')
      .orderBy('u.createdAt', 'DESC')
      .take(Math.min(filters.limit || 20, 100))
      .skip(filters.offset || 0);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
