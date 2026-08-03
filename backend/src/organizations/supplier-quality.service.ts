import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface QualityScore {
  orgId: string;
  orgName: string;
  overallScore: number;
  category: 'excellent' | 'good' | 'average' | 'poor';
  metrics: {
    productQuality: number;
    deliveryReliability: number;
    communication: number;
    documentation: number;
    compliance: number;
  };
  reviewCount: number;
  completedDeals: number;
  disputeRate: number;
  onTimeDeliveryRate: number;
}

export interface Review {
  id: string;
  reviewerOrgId: string;
  reviewerName: string;
  reviewedOrgId: string;
  dealId: string;
  rating: number;
  categories: {
    productQuality: number;
    deliveryReliability: number;
    communication: number;
    documentation: number;
  };
  comment: string;
  createdAt: Date;
}

/**
 * Supplier Quality Scoring Service
 * Calculates trust scores and quality metrics for suppliers.
 */
@Injectable()
export class SupplierQualityService {
  private readonly logger = new Logger(SupplierQualityService.name);

  constructor(
    @InjectRepository('reviews')
    private readonly reviewRepo: Repository<any>,
    @InjectRepository('deals')
    private readonly dealRepo: Repository<any>,
    @InjectRepository('organizations')
    private readonly orgRepo: Repository<any>,
  ) {}

  async calculateQualityScore(orgId: string): Promise<QualityScore | null> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) return null;

    const [reviews, completedDeals, allDeals] = await Promise.all([
      this.reviewRepo.find({ where: { reviewedOrgId: orgId } }),
      this.dealRepo.find({ where: { sellerId: orgId, status: 'completed' } }),
      this.dealRepo.find({ where: { sellerId: orgId } }),
    ]);

    const metrics = this.calculateMetrics(reviews, completedDeals);
    const overallScore = this.calculateOverallScore(metrics);
    const disputeRate = allDeals.length > 0
      ? (allDeals.filter((d: any) => d.status === 'disputed').length / allDeals.length) * 100
      : 0;
    const onTimeRate = completedDeals.length > 0
      ? (completedDeals.filter((d: any) => d.deliveredOnTime).length / completedDeals.length) * 100
      : 0;

    return {
      orgId,
      orgName: org.name,
      overallScore,
      category: this.getCategory(overallScore),
      metrics,
      reviewCount: reviews.length,
      completedDeals: completedDeals.length,
      disputeRate: Math.round(disputeRate * 10) / 10,
      onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
    };
  }

  async getTopSuppliers(limit: number = 10): Promise<QualityScore[]> {
    const suppliers = await this.orgRepo.find({ where: { type: 'cooperative' } });
    const scores = await Promise.all(
      suppliers.map((s: any) => this.calculateQualityScore(s.id)),
    );
    return scores
      .filter((s): s is QualityScore => s !== null)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }

  async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const newReview = this.reviewRepo.create({
      ...review,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
    const saved = await this.reviewRepo.save(newReview);

    // Recalculate quality score for reviewed organization
    await this.calculateQualityScore(review.reviewedOrgId);

    this.logger.log(`Review added: ${saved.id} for org ${review.reviewedOrgId}`);
    return saved;
  }

  private calculateMetrics(reviews: any[], deals: any[]) {
    if (reviews.length === 0) {
      return {
        productQuality: 0,
        deliveryReliability: 0,
        communication: 0,
        documentation: 0,
        compliance: 0,
      };
    }

    const avg = (key: string) =>
      reviews.reduce((sum: number, r: any) => sum + (r.categories?.[key] || 0), 0) / reviews.length;

    return {
      productQuality: Math.round(avg('productQuality') * 10) / 10,
      deliveryReliability: Math.round(avg('deliveryReliability') * 10) / 10,
      communication: Math.round(avg('communication') * 10) / 10,
      documentation: Math.round(avg('documentation') * 10) / 10,
      compliance: Math.round((deals.length > 0 ? 100 : 0) * 10) / 10,
    };
  }

  private calculateOverallScore(metrics: QualityScore['metrics']): number {
    const weights = {
      productQuality: 0.3,
      deliveryReliability: 0.25,
      communication: 0.2,
      documentation: 0.15,
      compliance: 0.1,
    };

    const score =
      metrics.productQuality * weights.productQuality +
      metrics.deliveryReliability * weights.deliveryReliability +
      metrics.communication * weights.communication +
      metrics.documentation * weights.documentation +
      metrics.compliance * weights.compliance;

    return Math.round(score * 10) / 10;
  }

  private getCategory(score: number): QualityScore['category'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }
}
