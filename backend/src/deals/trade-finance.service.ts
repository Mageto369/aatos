import { Injectable, Logger } from '@nestjs/common';

export interface TradeFinancePartner {
  id: string;
  name: string;
  products: string[];
  minAmount: number;
  maxAmount: number;
  currencies: string[];
  corridors: Array<{ origin: string; destination: string }>;
  interestRateRange: { min: number; max: number };
  termRange: { min: number; max: number }; // in days
  requirements: string[];
  contactEmail: string;
  contactPhone: string;
  website: string;
  rating: number;
  active: boolean;
}

export interface TradeFinanceRequest {
  dealId: string;
  orgId: string;
  productType: 'invoice_factoring' | 'po_financing' | 'supply_chain_finance' | 'export_credit';
  amount: number;
  currency: string;
  term: number; // in days
  origin: string;
  destination: string;
}

export interface TradeFinanceMatch {
  partner: TradeFinancePartner;
  score: number;
  reasons: string[];
  estimatedRate?: number;
}

/**
 * Trade Finance Referral Service
 * Matches deals with trade finance providers for invoice factoring, PO financing, etc.
 */
@Injectable()
export class TradeFinanceService {
  private readonly logger = new Logger(TradeFinanceService.name);
  private readonly partners: TradeFinancePartner[] = [];

  constructor() {
    this.initializePartners();
  }

  async findMatches(request: TradeFinanceRequest): Promise<{ requestId: string; matches: TradeFinanceMatch[] }> {
    const matches = this.partners
      .filter(p => p.active)
      .filter(p => p.products.includes(request.productType))
      .filter(p => request.amount >= p.minAmount && request.amount <= p.maxAmount)
      .filter(p => p.currencies.includes(request.currency))
      .filter(p => p.termRange.min <= request.term && p.termRange.max >= request.term)
      .map(partner => {
        const { score, reasons } = this.calculateMatchScore(partner, request);
        const estimatedRate = this.estimateRate(partner, request);
        return { partner, score, reasons, estimatedRate };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);

    this.logger.log(`Found ${matches.length} trade finance matches for deal ${request.dealId}`);

    return {
      requestId: crypto.randomUUID(),
      matches: matches.slice(0, 5),
    };
  }

  async getPartnersByProduct(productType: string): Promise<TradeFinancePartner[]> {
    return this.partners.filter(p => p.active && p.products.includes(productType));
  }

  private calculateMatchScore(partner: TradeFinancePartner, request: TradeFinanceRequest): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Product match
    if (partner.products.includes(request.productType)) {
      score += 30;
      reasons.push(`Offers ${request.productType}`);
    }

    // Amount fit
    if (request.amount >= partner.minAmount && request.amount <= partner.maxAmount) {
      score += 25;
      reasons.push('Amount within partner range');
    }

    // Corridor match
    const corridorMatch = partner.corridors.some(
      c => c.origin === request.origin && c.destination === request.destination,
    );
    if (corridorMatch) {
      score += 20;
      reasons.push('Covers the trade corridor');
    }

    // Term fit
    if (request.term >= partner.termRange.min && request.term <= partner.termRange.max) {
      score += 15;
      reasons.push('Term within partner range');
    }

    // Rating bonus
    if (partner.rating >= 4.5) {
      score += 10;
      reasons.push('Highly rated partner');
    }

    return { score, reasons };
  }

  private estimateRate(partner: TradeFinancePartner, request: TradeFinanceRequest): number {
    // Simplified rate estimation based on amount, term, and risk
    const baseRate = partner.interestRateRange.min;
    const riskPremium = (request.amount / partner.maxAmount) * (partner.interestRateRange.max - partner.interestRateRange.min);
    const termPremium = (request.term / partner.termRange.max) * 0.02;
    return Math.round((baseRate + riskPremium + termPremium) * 100) / 100;
  }

  private initializePartners(): void {
    this.partners.push(
      {
        id: 'tf-001',
        name: 'African Trade Finance Corporation',
        products: ['invoice_factoring', 'po_financing', 'export_credit'],
        minAmount: 50000,
        maxAmount: 5000000,
        currencies: ['USD', 'EUR', 'GBP'],
        corridors: [
          { origin: 'KE', destination: 'US' },
          { origin: 'KE', destination: 'EU' },
          { origin: 'NG', destination: 'US' },
        ],
        interestRateRange: { min: 0.06, max: 0.14 },
        termRange: { min: 30, max: 180 },
        requirements: ['purchase_order', 'invoice', 'buyer_credit_check'],
        contactEmail: 'trade@atfc.org',
        contactPhone: '+254 20 333 4444',
        website: 'https://atfc.org',
        rating: 4.6,
        active: true,
      },
      {
        id: 'tf-002',
        name: 'Stenn International',
        products: ['invoice_factoring', 'supply_chain_finance'],
        minAmount: 100000,
        maxAmount: 10000000,
        currencies: ['USD', 'EUR', 'GBP'],
        corridors: [
          { origin: 'KE', destination: 'US' },
          { origin: 'KE', destination: 'EU' },
          { origin: 'US', destination: 'EU' },
        ],
        interestRateRange: { min: 0.04, max: 0.10 },
        termRange: { min: 30, max: 120 },
        requirements: ['invoice', 'buyer_credit_insurance'],
        contactEmail: 'info@stenn.com',
        contactPhone: '+44 20 3780 5000',
        website: 'https://stenn.com',
        rating: 4.7,
        active: true,
      },
      {
        id: 'tf-003',
        name: 'Lendica',
        products: ['po_financing', 'supply_chain_finance'],
        minAmount: 25000,
        maxAmount: 2500000,
        currencies: ['USD'],
        corridors: [
          { origin: 'KE', destination: 'US' },
          { origin: 'NG', destination: 'US' },
        ],
        interestRateRange: { min: 0.08, max: 0.18 },
        termRange: { min: 15, max: 90 },
        requirements: ['purchase_order', 'buyer_verification'],
        contactEmail: 'trade@lendica.com',
        contactPhone: '+1 212 555 0200',
        website: 'https://lendica.com',
        rating: 4.3,
        active: true,
      },
    );
  }
}
