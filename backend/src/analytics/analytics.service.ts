import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Deal } from '../deals/entities/deal.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { RFQ } from '../rfqs/entities/rfq.entity';
import { ProductCategory } from '../products/entities/product-category.entity';

export interface DashboardStats {
  totalOrganizations: number;
  verifiedOrganizations: number;
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalRFQs: number;
  openRFQs: number;
  tradeVolume: number;
  averageDealValue: number;
  conversionRate: number;
  topCorridors: Array<{ origin: string; destination: string; count: number; volume: number }>;
  topProducts: Array<{ name: string; count: number; volume: number }>;
  monthlyGrowth: Array<{ month: string; deals: number; volume: number }>;
}

export interface OrganizationAnalytics {
  orgId: string;
  orgName: string;
  totalDeals: number;
  completedDeals: number;
  totalRFQs: number;
  responseRate: number;
  averageResponseTime: number;
  trustScore: number;
  tradeVolume: number;
  disputeRate: number;
}

/**
 * Analytics Service
 * Provides business intelligence and dashboard metrics for AATOS.
 */
/**
 * A deal counts as active until it reaches a terminal state. There is no
 * 'active' value in the deal_status enum — querying for one raised
 * `invalid input value for enum deal_status: "active"` and 500'd the whole
 * dashboard.
 */
const TERMINAL_DEAL_STATUSES = ['completed', 'cancelled', 'disputed'];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(RFQ)
    private readonly rfqRepo: Repository<RFQ>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalOrgs,
      verifiedOrgs,
      totalDeals,
      activeDeals,
      completedDeals,
      totalRFQs,
      openRFQs,
      tradeVolumeResult,
    ] = await Promise.all([
      this.orgRepo.count(),
      this.orgRepo.count({ where: { verificationLevel: 'fully_verified' } }),
      this.dealRepo.count(),
      this.dealRepo.count({ where: { status: Not(In(TERMINAL_DEAL_STATUSES)) } }),
      this.dealRepo.count({ where: { status: 'completed' } }),
      this.rfqRepo.count(),
      this.rfqRepo.count({ where: { status: 'published' } }),
      this.dealRepo
        .createQueryBuilder('d')
        .select('COALESCE(SUM(d.total_value_usd), 0)', 'total')
        .where('d.status = :status', { status: 'completed' })
        .getRawOne(),
    ]);

    const avgDealValue = completedDeals > 0
      ? (tradeVolumeResult?.total || 0) / completedDeals
      : 0;

    const conversionRate = totalRFQs > 0
      ? (completedDeals / totalRFQs) * 100
      : 0;

    const topCorridors = await this.getTopCorridors();
    const topProducts = await this.getTopProducts();
    const monthlyGrowth = await this.getMonthlyGrowth();

    return {
      totalOrganizations: totalOrgs,
      verifiedOrganizations: verifiedOrgs,
      totalDeals,
      activeDeals,
      completedDeals,
      totalRFQs,
      openRFQs,
      tradeVolume: parseFloat(tradeVolumeResult?.total || 0),
      averageDealValue: avgDealValue,
      conversionRate,
      topCorridors,
      topProducts,
      monthlyGrowth,
    };
  }

  async getOrganizationAnalytics(orgId: string): Promise<OrganizationAnalytics | null> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) return null;

    // A deal belongs to both parties, so an organization's deals are the ones
    // it is on either side of. Counting only buyerOrgId meant every supplier
    // saw zero deals and zero volume however much it had shipped — and the
    // pilot is Kenyan suppliers selling to U.S. buyers, so that was most of
    // the users.
    const isParty = [{ buyerOrgId: orgId }, { supplierOrgId: orgId }];

    const [totalDeals, completedDeals, totalRFQs, tradeVolumeResult] = await Promise.all([
      this.dealRepo.count({ where: isParty }),
      this.dealRepo.count({
        where: [
          { buyerOrgId: orgId, status: 'completed' },
          { supplierOrgId: orgId, status: 'completed' },
        ],
      }),
      this.rfqRepo.count({ where: { buyerOrgId: orgId } }),
      this.dealRepo
        .createQueryBuilder('d')
        .select('COALESCE(SUM(d.total_value_usd), 0)', 'total')
        // Property path, not a column name. `d.buyer_id` is neither: the
        // property is buyerOrgId and the column is buyer_org_id, so TypeORM
        // passed it through untouched and every call to this endpoint failed
        // with `column d.buyer_id does not exist`. It 500'd for its own
        // organization, not only for a stranger, which is why no cross-tenant
        // test had caught the missing scope either.
        .where('d.buyerOrgId = :orgId OR d.supplierOrgId = :orgId', { orgId })
        .andWhere('d.status = :status', { status: 'completed' })
        .getRawOne(),
    ]);

    return {
      orgId,
      orgName: org.name,
      totalDeals,
      completedDeals,
      totalRFQs,
      responseRate: 0, // TODO: calculate from quotation responses
      averageResponseTime: 0, // TODO: calculate from timestamps
      trustScore: org.trustScore || 0,
      tradeVolume: parseFloat(tradeVolumeResult?.total || 0),
      disputeRate: 0, // TODO: calculate from disputes
    };
  }

  async getTopCorridors(limit: number = 5): Promise<DashboardStats['topCorridors']> {
    const results = await this.dealRepo
      .createQueryBuilder('d')
      .leftJoin('d.buyer', 'buyer')
      .leftJoin('d.supplier', 'supplier')
      .select('supplier.country_code', 'origin')
      .addSelect('buyer.country_code', 'destination')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(d.total_value_usd), 0)', 'volume')
      .where('d.status = :status', { status: 'completed' })
      .groupBy('supplier.country_code')
      .addGroupBy('buyer.country_code')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r: any) => ({
      origin: r.origin,
      destination: r.destination,
      count: parseInt(r.count, 10),
      volume: parseFloat(r.volume),
    }));
  }

  async getTopProducts(limit: number = 5): Promise<DashboardStats['topProducts']> {
    // Deal has no product relation — it records productCategoryId, not a
    // specific listing — so this aggregates by category. Joining 'd.product'
    // raised "Relation with property path product in entity was not found"
    // and 500'd the dashboard.
    const results = await this.dealRepo
      .createQueryBuilder('d')
      .leftJoin(ProductCategory, 'pc', 'pc.id = d.product_category_id')
      .select('pc.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(d.total_value_usd), 0)', 'volume')
      .where('d.status = :status', { status: 'completed' })
      .groupBy('pc.name')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r: any) => ({
      name: r.name,
      count: parseInt(r.count, 10),
      volume: parseFloat(r.volume),
    }));
  }

  async getMonthlyGrowth(months: number = 6): Promise<DashboardStats['monthlyGrowth']> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const results = await this.dealRepo
      .createQueryBuilder('d')
      .select("TO_CHAR(d.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'deals')
      .addSelect('COALESCE(SUM(d.total_value_usd), 0)', 'volume')
      .where('d.created_at >= :startDate', { startDate })
      .groupBy("TO_CHAR(d.created_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return results.map((r: any) => ({
      month: r.month,
      deals: parseInt(r.deals, 10),
      volume: parseFloat(r.volume),
    }));
  }
}
