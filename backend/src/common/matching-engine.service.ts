import { Injectable, Logger } from '@nestjs/common';

export interface SupplierProfile {
  orgId: string;
  name: string;
  country: string;
  products: string[];
  certifications: string[];
  minOrderSize: number;
  maxOrderSize: number;
  leadTimeDays: number;
  qualityScore: number; // 0-100
  reliabilityScore: number; // 0-100
  priceCompetitiveness: number; // 0-100
  sustainabilityScore: number; // 0-100
  exportMarkets: string[];
  languages: string[];
}

export interface BuyerProfile {
  orgId: string;
  name: string;
  country: string;
  productInterests: string[];
  requiredCertifications: string[];
  minQualityScore: number;
  preferredLeadTimeDays: number;
  targetPriceRange: { min: number; max: number; currency: string };
  importMarkets: string[];
  languages: string[];
}

export interface MatchResult {
  supplier: SupplierProfile;
  buyer: BuyerProfile;
  score: number; // 0-100
  reasons: string[];
  risks: string[];
  recommendation: 'strong_match' | 'good_match' | 'potential_match' | 'not_recommended';
}

/**
 * AI/ML Matching Engine Service
 * Supplier-buyer recommendation engine with multi-factor scoring.
 */
@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);
  private readonly suppliers: Map<string, SupplierProfile> = new Map();
  private readonly buyers: Map<string, BuyerProfile> = new Map();

  async indexSupplier(profile: SupplierProfile): Promise<void> {
    this.suppliers.set(profile.orgId, profile);
    this.logger.debug(`Supplier indexed: ${profile.name}`);
  }

  async indexBuyer(profile: BuyerProfile): Promise<void> {
    this.buyers.set(profile.orgId, profile);
    this.logger.debug(`Buyer indexed: ${profile.name}`);
  }

  async findMatchesForBuyer(buyerOrgId: string, limit: number = 10): Promise<MatchResult[]> {
    const buyer = this.buyers.get(buyerOrgId);
    if (!buyer) {
      throw new Error(`Buyer not found: ${buyerOrgId}`);
    }

    const results: MatchResult[] = [];

    for (const supplier of this.suppliers.values()) {
      const match = this.calculateMatch(supplier, buyer);
      if (match.score > 30) { // Minimum threshold
        results.push(match);
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async findMatchesForSupplier(supplierOrgId: string, limit: number = 10): Promise<MatchResult[]> {
    const supplier = this.suppliers.get(supplierOrgId);
    if (!supplier) {
      throw new Error(`Supplier not found: ${supplierOrgId}`);
    }

    const results: MatchResult[] = [];

    for (const buyer of this.buyers.values()) {
      const match = this.calculateMatch(supplier, buyer);
      if (match.score > 30) {
        results.push(match);
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getMarketInsights(_product: string, _destination: string): Promise<{
    avgPrice: number;
    priceTrend: 'rising' | 'stable' | 'falling';
    topSuppliers: string[];
    demandLevel: 'high' | 'medium' | 'low';
    seasonality: string;
  }> {
    // In production, this would analyze historical trade data
    return {
      avgPrice: 0,
      priceTrend: 'stable',
      topSuppliers: [],
      demandLevel: 'medium',
      seasonality: 'year_round',
    };
  }

  private calculateMatch(supplier: SupplierProfile, buyer: BuyerProfile): MatchResult {
    let score = 0;
    const reasons: string[] = [];
    const risks: string[] = [];

    // Product match (highest weight)
    const productOverlap = supplier.products.filter(p => buyer.productInterests.includes(p));
    if (productOverlap.length > 0) {
      score += 35;
      reasons.push(`Supplies requested products: ${productOverlap.join(', ')}`);
    } else {
      risks.push('No product overlap');
    }

    // Certification match
    const certOverlap = supplier.certifications.filter(c => buyer.requiredCertifications.includes(c));
    if (certOverlap.length === buyer.requiredCertifications.length) {
      score += 20;
      reasons.push('All required certifications met');
    } else if (certOverlap.length > 0) {
      score += 10;
      reasons.push('Some certifications met');
      risks.push('Missing required certifications');
    } else if (buyer.requiredCertifications.length > 0) {
      risks.push('No required certifications');
    }

    // Quality score
    if (supplier.qualityScore >= buyer.minQualityScore) {
      score += 15;
      reasons.push('Quality score meets requirements');
    } else {
      risks.push('Quality score below minimum threshold');
    }

    // Lead time
    if (supplier.leadTimeDays <= buyer.preferredLeadTimeDays) {
      score += 10;
      reasons.push('Lead time within preferred range');
    } else {
      risks.push('Lead time longer than preferred');
    }

    // Geographic compatibility
    if (supplier.exportMarkets.includes(buyer.country)) {
      score += 10;
      reasons.push(`Has export experience to ${buyer.country}`);
    }

    // Price competitiveness
    if (supplier.priceCompetitiveness >= 70) {
      score += 5;
      reasons.push('Competitive pricing');
    }

    // Reliability
    if (supplier.reliabilityScore >= 80) {
      score += 5;
      reasons.push('High reliability score');
    }

    // Determine recommendation
    let recommendation: MatchResult['recommendation'];
    if (score >= 80) recommendation = 'strong_match';
    else if (score >= 60) recommendation = 'good_match';
    else if (score >= 40) recommendation = 'potential_match';
    else recommendation = 'not_recommended';

    return {
      supplier,
      buyer,
      score: Math.min(100, score),
      reasons,
      risks,
      recommendation,
    };
  }
}
