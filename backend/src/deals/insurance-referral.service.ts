import { Injectable, Logger } from '@nestjs/common';

export interface InsurancePartner {
  id: string;
  name: string;
  products: string[];
  coverage: string[];
  corridors: Array<{ origin: string; destination: string }>;
  minInsuredValue: number;
  maxInsuredValue: number;
  contactEmail: string;
  contactPhone: string;
  website: string;
  rating: number;
  active: boolean;
}

export interface InsuranceReferralRequest {
  dealId: string;
  orgId: string;
  origin: string;
  destination: string;
  productType: string;
  insuredValue: number;
  coverageTypes: string[];
}

export interface InsuranceReferralResult {
  requestId: string;
  matches: Array<{
    partner: InsurancePartner;
    score: number;
    reasons: string[];
    estimatedPremium?: number;
  }>;
}

/**
 * Insurance Partner Referral Service
 * Matches deals with suitable cargo insurance providers.
 */
@Injectable()
export class InsuranceReferralService {
  private readonly logger = new Logger(InsuranceReferralService.name);
  private readonly partners: InsurancePartner[] = [];

  constructor() {
    this.initializePartners();
  }

  async findMatches(request: InsuranceReferralRequest): Promise<InsuranceReferralResult> {
    const matches = this.partners
      .filter(p => p.active)
      .filter(p => request.insuredValue >= p.minInsuredValue && request.insuredValue <= p.maxInsuredValue)
      .map(partner => {
        const { score, reasons } = this.calculateMatchScore(partner, request);
        const estimatedPremium = this.estimatePremium(partner, request);
        return { partner, score, reasons, estimatedPremium };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);

    this.logger.log(`Found ${matches.length} insurance matches for deal ${request.dealId}`);

    return {
      requestId: crypto.randomUUID(),
      matches: matches.slice(0, 5),
    };
  }

  async findPartnersForCorridor(origin: string, destination: string): Promise<InsurancePartner[]> {
    return this.partners.filter(
      p => p.active && p.corridors.some(c => c.origin === origin && c.destination === destination),
    );
  }

  async getPartnersByCoverage(coverageType: string): Promise<InsurancePartner[]> {
    return this.partners.filter(
      p => p.active && p.coverage.includes(coverageType),
    );
  }

  private calculateMatchScore(partner: InsurancePartner, request: InsuranceReferralRequest): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Corridor match
    const corridorMatch = partner.corridors.some(
      c => c.origin === request.origin && c.destination === request.destination,
    );
    if (corridorMatch) {
      score += 35;
      reasons.push('Covers the requested corridor');
    }

    // Coverage type match
    const coverageMatches = partner.coverage.filter(c => request.coverageTypes.includes(c));
    if (coverageMatches.length > 0) {
      score += coverageMatches.length * 15;
      reasons.push(`Offers ${coverageMatches.join(', ')} coverage`);
    }

    // Value range match
    if (request.insuredValue >= partner.minInsuredValue && request.insuredValue <= partner.maxInsuredValue) {
      score += 20;
      reasons.push('Insured value within partner range');
    }

    // Rating bonus
    if (partner.rating >= 4.5) {
      score += 10;
      reasons.push('Highly rated partner');
    }

    return { score, reasons };
  }

  estimatePremium(partner: InsurancePartner, request: InsuranceReferralRequest): number | undefined {
    // Simplified premium estimation: 0.1% - 0.5% of insured value based on corridor risk
    const baseRate = 0.001;
    const riskMultiplier = partner.corridors.some(c => c.origin === request.origin && c.destination === request.destination) ? 1.0 : 1.5;
    return Math.round(request.insuredValue * baseRate * riskMultiplier * 100) / 100;
  }

  private initializePartners(): void {
    this.partners.push(
      {
        id: 'ins-001',
        name: 'African Trade Insurance Agency (ATI)',
        products: ['cargo_insurance', 'trade_credit', 'political_risk'],
        coverage: ['all_risk', 'warehouse_to_warehouse', 'transit'],
        corridors: [
          { origin: 'KE', destination: 'US' },
          { origin: 'KE', destination: 'EU' },
        ],
        minInsuredValue: 10000,
        maxInsuredValue: 5000000,
        contactEmail: 'trade@ati-insurance.org',
        contactPhone: '+254 20 222 0000',
        website: 'https://ati-insurance.org',
        rating: 4.6,
        active: true,
      },
      {
        id: 'ins-002',
        name: 'London Coffee Insurance Brokers',
        products: ['cargo_insurance', 'specialty_coffee_coverage'],
        coverage: ['all_risk', 'quality_degradation', 'temperature_variation'],
        corridors: [
          { origin: 'KE', destination: 'US' },
          { origin: 'KE', destination: 'UK' },
        ],
        minInsuredValue: 5000,
        maxInsuredValue: 10000000,
        contactEmail: 'coffee@lcib.co.uk',
        contactPhone: '+44 20 7946 0958',
        website: 'https://lcib.co.uk',
        rating: 4.8,
        active: true,
      },
      {
        id: 'ins-003',
        name: 'Marine Cargo Insurance Partners',
        products: ['marine_cargo', 'inland_transit'],
        coverage: ['all_risk', 'ftsrcc', 'wa'],
        corridors: [
          { origin: 'KE', destination: 'US' },
          { origin: 'KE', destination: 'EU' },
          { origin: 'US', destination: 'US' },
        ],
        minInsuredValue: 25000,
        maxInsuredValue: 25000000,
        contactEmail: 'cargo@mci-partners.com',
        contactPhone: '+1 212 555 0199',
        website: 'https://mci-partners.com',
        rating: 4.4,
        active: true,
      },
    );
  }
}
