import { Injectable, Logger } from '@nestjs/common';

export interface FxRate {
  base: string;
  target: string;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface ConversionResult {
  amount: number;
  originalCurrency: string;
  targetCurrency: string;
  convertedAmount: number;
  rate: number;
  rateTimestamp: Date;
  markupApplied: boolean;
  markupPercentage: number;
  finalAmount: number;
}

export interface HedgingOption {
  type: 'forward' | 'option' | 'spot';
  rate: number;
  expiryDate: Date;
  premium?: number;
}

/**
 * Multi-Currency Conversion Engine
 * Handles FX rates, conversions, markup, and hedging options.
 */
@Injectable()
export class CurrencyConversionService {
  private readonly logger = new Logger(CurrencyConversionService.name);
  private readonly rates: Map<string, FxRate> = new Map();
  private readonly defaultMarkup = 0.005; // 0.5% markup

  constructor() {
    this.initializeRates();
  }

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    applyMarkup: boolean = true,
  ): Promise<ConversionResult> {
    if (fromCurrency === toCurrency) {
      return {
        amount,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency,
        convertedAmount: amount,
        rate: 1,
        rateTimestamp: new Date(),
        markupApplied: false,
        markupPercentage: 0,
        finalAmount: amount,
      };
    }

    const rate = await this.getRate(fromCurrency, toCurrency);
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} → ${toCurrency}`);
    }

    const convertedAmount = amount * rate.rate;
    const markupPercentage = applyMarkup ? this.defaultMarkup : 0;
    const finalAmount = applyMarkup ? convertedAmount * (1 - markupPercentage) : convertedAmount;

    return {
      amount,
      originalCurrency: fromCurrency,
      targetCurrency: toCurrency,
      convertedAmount,
      rate: rate.rate,
      rateTimestamp: rate.timestamp,
      markupApplied: applyMarkup,
      markupPercentage,
      finalAmount,
    };
  }

  async getRate(base: string, target: string): Promise<FxRate | undefined> {
    const key = `${base.toUpperCase()}_${target.toUpperCase()}`;
    return this.rates.get(key);
  }

  async getAllRates(): Promise<FxRate[]> {
    return Array.from(this.rates.values());
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const currencies = new Set<string>();
    for (const rate of this.rates.values()) {
      currencies.add(rate.base);
      currencies.add(rate.target);
    }
    return Array.from(currencies).sort();
  }

  async getHedgingOptions(base: string, target: string, _amount: number): Promise<HedgingOption[]> {
    const spotRate = await this.getRate(base, target);
    if (!spotRate) return [];

    const now = new Date();
    const options: HedgingOption[] = [
      {
        type: 'spot',
        rate: spotRate.rate,
        expiryDate: now,
      },
      {
        type: 'forward',
        rate: spotRate.rate * 1.02, // 2% premium for 30-day forward
        expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'forward',
        rate: spotRate.rate * 1.04, // 4% premium for 90-day forward
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    ];

    return options;
  }

  async updateRate(base: string, target: string, rate: number, source: string = 'manual'): Promise<void> {
    const key = `${base.toUpperCase()}_${target.toUpperCase()}`;
    this.rates.set(key, {
      base: base.toUpperCase(),
      target: target.toUpperCase(),
      rate,
      timestamp: new Date(),
      source,
    });
    this.logger.log(`FX rate updated: ${base} → ${target} = ${rate}`);
  }

  private initializeRates(): void {
    const initialRates = [
      { base: 'USD', target: 'KES', rate: 129.5 },
      { base: 'USD', target: 'NGN', rate: 460.0 },
      { base: 'USD', target: 'GHS', rate: 11.8 },
      { base: 'USD', target: 'EUR', rate: 0.92 },
      { base: 'USD', target: 'GBP', rate: 0.79 },
      { base: 'EUR', target: 'USD', rate: 1.09 },
      { base: 'EUR', target: 'KES', rate: 141.2 },
      { base: 'GBP', target: 'USD', rate: 1.27 },
      { base: 'KES', target: 'USD', rate: 0.0077 },
      { base: 'NGN', target: 'USD', rate: 0.0022 },
    ];

    for (const r of initialRates) {
      this.rates.set(`${r.base}_${r.target}`, {
        ...r,
        timestamp: new Date(),
        source: 'initialization',
      });
    }
  }
}
