import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';
import { FlutterwaveService } from './flutterwave.service';
import { BankTransferProvider, MobileMoneyProvider } from './bank-transfer.provider';

/**
 * Payment Provider Registry
 * Manages multiple payment providers and routes to the correct one.
 * AATOS does not custody funds. All money movement is handled by licensed providers.
 */
@Injectable()
export class PaymentProviderRegistry {
  private readonly logger = new Logger(PaymentProviderRegistry.name);
  private readonly providers = new Map<string, PaymentProvider>();
  private readonly defaultProvider: string;

  constructor(
    private readonly flutterwave: FlutterwaveService,
    private readonly bankTransfer: BankTransferProvider,
    private readonly mobileMoney: MobileMoneyProvider,
  ) {
    this.register(flutterwave);
    this.register(bankTransfer);
    this.register(mobileMoney);
    this.defaultProvider = flutterwave.name;
    this.logger.log(`Registered payment providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  register(provider: PaymentProvider): void {
    this.providers.set(provider.name, provider);
    this.logger.log(`Registered payment provider: ${provider.name}`);
  }

  get(name?: string): PaymentProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider '${providerName}' not found. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    return provider;
  }

  list(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  supportsCurrency(currency: string, providerName?: string): boolean {
    const provider = this.get(providerName);
    return provider.supportedCurrencies.includes(currency.toUpperCase());
  }

  getSupportedCurrencies(): string[] {
    const currencies = new Set<string>();
    for (const provider of this.providers.values()) {
      for (const c of provider.supportedCurrencies) currencies.add(c);
    }
    return Array.from(currencies);
  }

  /**
   * Find the best provider for a given currency and method
   */
  findBestProvider(currency: string, method?: string): PaymentProvider {
    if (method && this.providers.has(method)) {
      const provider = this.providers.get(method)!;
      if (provider.supportedCurrencies.includes(currency.toUpperCase())) {
        return provider;
      }
    }

    // Find first provider that supports the currency
    for (const provider of this.providers.values()) {
      if (provider.supportedCurrencies.includes(currency.toUpperCase())) {
        return provider;
      }
    }

    throw new Error(`No provider found for currency ${currency}`);
  }
}
