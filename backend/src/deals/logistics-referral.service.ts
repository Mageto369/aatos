import { Injectable, Logger } from '@nestjs/common';

export interface LogisticsPartner {
  id: string;
  name: string;
  services: string[];
  corridors: Array<{ origin: string; destination: string }>;
  specialties: string[];
  certifications: string[];
  contactEmail: string;
  contactPhone: string;
  website: string;
  rating: number;
  active: boolean;
}

export interface ReferralRequest {
  dealId: string;
  orgId: string;
  origin: string;
  destination: string;
  productType: string;
  quantity: number;
  preferredServices: string[];
}

export interface ReferralResult {
  requestId: string;
  matches: Array<{
    partner: LogisticsPartner;
    score: number;
    reasons: string[];
  }>;
}

/**
 * Logistics Partner Referral Service
 * Matches deals with suitable logistics providers based on corridor and product type.
 */
@Injectable()
export class LogisticsReferralService {
  private readonly logger = new Logger(LogisticsReferralService.name);
  private readonly partners: LogisticsPartner[] = [];

  constructor() {
    this.initializePartners();
  }

  async findMatches(request: ReferralRequest): Promise<ReferralResult> {
    const matches = this.partners
      .filter(p => p.active)
      .map(partner => {
        const { score, reasons } = this.calculateMatchScore(partner, request);
        return { partner, score, reasons };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);

    this.logger.log(`Found ${matches.length} logistics matches for deal ${request.dealId}`);

    return {
      requestId: crypto.randomUUID(),
      matches: matches.slice(0, 5),
    };
  }

  async findPartnersForCorridor(origin: string, destination: string): Promise<LogisticsPartner[]> {
    return this.getPartnersByCorridor(origin, destination);
  }

  async getQuote(partnerId: string, request: ReferralRequest): Promise<{ partner: LogisticsPartner; estimatedCost: number } | null> {
    const partner = this.partners.find(p => p.id === partnerId);
    if (!partner) return null;
    const estimatedCost = request.quantity * 100; // Simplified estimate
    return { partner, estimatedCost };
  }

  async getPartnersByCorridor(origin: string, destination: string): Promise<LogisticsPartner[]> {
    return this.partners.filter(
      p => p.active && p.corridors.some(c => c.origin === origin && c.destination === destination),
    );
  }

  async getAllActivePartners(): Promise<LogisticsPartner[]> {
    return this.partners.filter(p => p.active);
  }

  private calculateMatchScore(partner: LogisticsPartner, request: ReferralRequest): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Corridor match (highest weight)
    const corridorMatch = partner.corridors.some(
      c => c.origin === request.origin && c.destination === request.destination,
    );
    if (corridorMatch) {
      score += 40;
      reasons.push('Serves the requested corridor');
    }

    // Service match
    const serviceMatches = partner.services.filter(s => request.preferredServices.includes(s));
    if (serviceMatches.length > 0) {
      score += serviceMatches.length * 10;
      reasons.push(`Offers ${serviceMatches.join(', ')} services`);
    }

    // Product specialty match
    if (partner.specialties.includes(request.productType)) {
      score += 20;
      reasons.push(`Specializes in ${request.productType}`);
    }

    // Rating bonus
    if (partner.rating >= 4.5) {
      score += 10;
      reasons.push('Highly rated partner');
    }

    return { score, reasons };
  }

  private initializePartners(): void {
    this.partners.push(
      {
        id: 'log-001',
        name: 'Kenya Logistics Ltd',
        services: ['ocean_freight', 'warehousing', 'customs_brokerage'],
        corridors: [{ origin: 'KE', destination: 'US' }],
        specialties: ['green_coffee', 'agricultural_products'],
        certifications: ['AEO', 'ISO-9001'],
        contactEmail: 'ops@kenyalogistics.co.ke',
        contactPhone: '+254 20 123 4567',
        website: 'https://kenyalogistics.co.ke',
        rating: 4.7,
        active: true,
      },
      {
        id: 'log-002',
        name: 'East African Freight Solutions',
        services: ['air_freight', 'ocean_freight', 'cold_chain'],
        corridors: [
          { origin: 'KE', destination: 'US' },
          { origin: 'KE', destination: 'EU' },
        ],
        specialties: ['perishables', 'green_coffee', 'nuts'],
        certifications: ['BRC', 'IFS Logistics'],
        contactEmail: 'quotes@eaf-solutions.com',
        contactPhone: '+254 20 987 6543',
        website: 'https://eaf-solutions.com',
        rating: 4.5,
        active: true,
      },
      {
        id: 'log-003',
        name: 'US Coffee Importers Logistics',
        services: ['drayage', 'warehousing', 'customs_brokerage'],
        corridors: [{ origin: 'US', destination: 'US' }],
        specialties: ['green_coffee', 'specialty_coffee'],
        certifications: ['SCA', 'USDA-Organic'],
        contactEmail: 'logistics@uscoffee-logistics.com',
        contactPhone: '+1 212 555 0123',
        website: 'https://uscoffee-logistics.com',
        rating: 4.8,
        active: true,
      },
    );
  }
}
