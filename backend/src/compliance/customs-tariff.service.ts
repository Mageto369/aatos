import { Injectable, Logger } from '@nestjs/common';

export interface HsCode {
  code: string;
  description: string;
  chapter: string;
  heading: string;
  subheading: string;
  productType: string;
}

export interface TariffRate {
  hsCode: string;
  country: string;
  mfnRate: number; // Most Favored Nation rate
  preferentialRate?: number;
  preferentialAgreement?: string;
  specificDuty?: string;
  effectiveDate: Date;
}

export interface LandedCostCalculation {
  productValue: number;
  freightCost: number;
  insuranceCost: number;
  dutyAmount: number;
  vatAmount: number;
  otherTaxes: number;
  totalLandedCost: number;
  breakdown: Array<{ name: string; amount: number }>;
}

/**
 * Customs Tariff Integration Service
 * HS code lookup, duty calculation, and landed cost estimation.
 */
@Injectable()
export class CustomsTariffService {
  private readonly logger = new Logger(CustomsTariffService.name);
  private readonly hsCodes: Map<string, HsCode> = new Map();
  private readonly tariffRates: Map<string, TariffRate[]> = new Map();

  constructor() {
    this.initializeHsCodes();
    this.initializeTariffRates();
  }

  async lookupHsCode(query: string): Promise<HsCode[]> {
    const results: HsCode[] = [];
    const lowerQuery = query.toLowerCase();

    for (const hsCode of this.hsCodes.values()) {
      if (
        hsCode.code.includes(query) ||
        hsCode.description.toLowerCase().includes(lowerQuery) ||
        hsCode.productType.toLowerCase().includes(lowerQuery)
      ) {
        results.push(hsCode);
      }
    }

    return results.slice(0, 20);
  }

  async getHsCode(code: string): Promise<HsCode | undefined> {
    return this.hsCodes.get(code);
  }

  async getTariffRate(hsCode: string, country: string): Promise<TariffRate | undefined> {
    const rates = this.tariffRates.get(`${hsCode}_${country}`);
    return rates?.[0];
  }

  async calculateLandedCost(data: {
    hsCode: string;
    productValue: number;
    freightCost: number;
    insuranceCost: number;
    destinationCountry: string;
    originCountry: string;
  }): Promise<LandedCostCalculation> {
    const tariff = await this.getTariffRate(data.hsCode, data.destinationCountry);
    if (!tariff) {
      throw new Error(`Tariff rate not found for ${data.hsCode} in ${data.destinationCountry}`);
    }

    const cifValue = data.productValue + data.freightCost + data.insuranceCost;
    const dutyRate = tariff.preferentialRate || tariff.mfnRate;
    const dutyAmount = cifValue * (dutyRate / 100);

    // VAT calculation (simplified — varies by country)
    const vatRate = this.getVatRate(data.destinationCountry);
    const vatAmount = (cifValue + dutyAmount) * (vatRate / 100);

    // Other taxes (simplified)
    const otherTaxes = this.calculateOtherTaxes(data.destinationCountry, cifValue);

    const totalLandedCost = cifValue + dutyAmount + vatAmount + otherTaxes;

    return {
      productValue: data.productValue,
      freightCost: data.freightCost,
      insuranceCost: data.insuranceCost,
      dutyAmount: Math.round(dutyAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      otherTaxes: Math.round(otherTaxes * 100) / 100,
      totalLandedCost: Math.round(totalLandedCost * 100) / 100,
      breakdown: [
        { name: 'Product Value', amount: data.productValue },
        { name: 'Freight', amount: data.freightCost },
        { name: 'Insurance', amount: data.insuranceCost },
        { name: 'Customs Duty', amount: Math.round(dutyAmount * 100) / 100 },
        { name: 'VAT', amount: Math.round(vatAmount * 100) / 100 },
        { name: 'Other Taxes', amount: Math.round(otherTaxes * 100) / 100 },
      ],
    };
  }

  async getPreferentialAgreements(country: string): Promise<string[]> {
    const agreements = new Set<string>();
    for (const rates of this.tariffRates.values()) {
      for (const rate of rates) {
        if (rate.country === country && rate.preferentialAgreement) {
          agreements.add(rate.preferentialAgreement);
        }
      }
    }
    return Array.from(agreements);
  }

  private getVatRate(country: string): number {
    const vatRates: Record<string, number> = {
      US: 0, // No federal VAT
      KE: 16,
      NG: 7.5,
      GH: 15,
      UK: 20,
      DE: 19,
      FR: 20,
    };
    return vatRates[country] || 0;
  }

  private calculateOtherTaxes(country: string, cifValue: number): number {
    const otherTaxRates: Record<string, number> = {
      US: 0.0065, // Merchandise Processing Fee (simplified)
      KE: 0.02, // Railway Development Levy (simplified)
    };
    return cifValue * (otherTaxRates[country] || 0);
  }

  private initializeHsCodes(): void {
    const codes: HsCode[] = [
      {
        code: '0901.11',
        description: 'Coffee, not roasted, not decaffeinated',
        chapter: '09',
        heading: '01',
        subheading: '11',
        productType: 'green_coffee',
      },
      {
        code: '0901.12',
        description: 'Coffee, not roasted, decaffeinated',
        chapter: '09',
        heading: '01',
        subheading: '12',
        productType: 'green_coffee',
      },
      {
        code: '0901.21',
        description: 'Coffee, roasted, not decaffeinated',
        chapter: '09',
        heading: '01',
        subheading: '21',
        productType: 'roasted_coffee',
      },
      {
        code: '0901.22',
        description: 'Coffee, roasted, decaffeinated',
        chapter: '09',
        heading: '01',
        subheading: '22',
        productType: 'roasted_coffee',
      },
      {
        code: '0801.32',
        description: 'Cashew nuts, shelled',
        chapter: '08',
        heading: '01',
        subheading: '32',
        productType: 'nuts',
      },
      {
        code: '0904.20',
        description: 'Fruits of the genus Capsicum or of the genus Pimenta, dried',
        chapter: '09',
        heading: '04',
        subheading: '20',
        productType: 'spices',
      },
    ];

    for (const code of codes) {
      this.hsCodes.set(code.code, code);
    }
  }

  private initializeTariffRates(): void {
    const rates: TariffRate[] = [
      {
        hsCode: '0901.11',
        country: 'US',
        mfnRate: 0,
        preferentialRate: 0,
        preferentialAgreement: 'AGOA',
        effectiveDate: new Date('2026-01-01'),
      },
      {
        hsCode: '0901.11',
        country: 'US',
        mfnRate: 0,
        effectiveDate: new Date('2026-01-01'),
      },
      {
        hsCode: '0901.11',
        country: 'EU',
        mfnRate: 0,
        preferentialRate: 0,
        preferentialAgreement: 'EAC-EU EPA',
        effectiveDate: new Date('2026-01-01'),
      },
      {
        hsCode: '0801.32',
        country: 'US',
        mfnRate: 0,
        preferentialRate: 0,
        preferentialAgreement: 'AGOA',
        effectiveDate: new Date('2026-01-01'),
      },
      {
        hsCode: '0901.11',
        country: 'UK',
        mfnRate: 0,
        preferentialRate: 0,
        preferentialAgreement: 'EAC-UK EPA',
        effectiveDate: new Date('2026-01-01'),
      },
    ];

    for (const rate of rates) {
      const key = `${rate.hsCode}_${rate.country}`;
      if (!this.tariffRates.has(key)) {
        this.tariffRates.set(key, []);
      }
      this.tariffRates.get(key)!.push(rate);
    }
  }
}
