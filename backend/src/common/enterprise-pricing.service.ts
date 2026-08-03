import { Injectable, Logger } from '@nestjs/common';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyFee: number;
  transactionFeePercent: number;
  features: string[];
  limits: {
    maxUsers: number;
    maxTransactions: number;
    maxStorageGB: number;
    apiCallsPerMonth: number;
  };
  support: 'community' | 'email' | 'priority' | 'dedicated';
  sla: {
    uptimePercent: number;
    responseTimeHours: number;
    resolutionTimeHours: number;
  };
  active: boolean;
}

export interface Subscription {
  id: string;
  orgId: string;
  tierId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  startDate: Date;
  endDate?: Date;
  trialEndsAt?: Date;
  autoRenew: boolean;
  billingCycle: 'monthly' | 'annual';
}

export interface UsageReport {
  orgId: string;
  period: string;
  transactions: number;
  apiCalls: number;
  storageUsedGB: number;
  users: number;
  fees: {
    subscription: number;
    transaction: number;
    overage: number;
    total: number;
  };
}

/**
 * Enterprise Pricing Service
 * Manages tiered pricing, subscriptions, and usage billing.
 */
@Injectable()
export class EnterprisePricingService {
  private readonly logger = new Logger(EnterprisePricingService.name);
  private readonly tiers: Map<string, PricingTier> = new Map();
  private readonly subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    this.initializeTiers();
  }

  async getAllTiers(): Promise<PricingTier[]> {
    return Array.from(this.tiers.values()).filter(t => t.active);
  }

  async getTier(id: string): Promise<PricingTier | undefined> {
    return this.tiers.get(id);
  }

  async createSubscription(orgId: string, tierId: string, billingCycle: 'monthly' | 'annual' = 'monthly'): Promise<Subscription> {
    const tier = this.tiers.get(tierId);
    if (!tier) {
      throw new Error(`Pricing tier not found: ${tierId}`);
    }

    const subscription: Subscription = {
      id: crypto.randomUUID(),
      orgId,
      tierId,
      status: 'trialing',
      startDate: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      autoRenew: true,
      billingCycle,
    };

    this.subscriptions.set(subscription.id, subscription);
    this.logger.log(`Subscription created: ${subscription.id} for org ${orgId} on tier ${tierId}`);
    return subscription;
  }

  async getSubscription(orgId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(s => s.orgId === orgId && s.status === 'active');
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription | undefined> {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return undefined;

    sub.status = 'cancelled';
    sub.endDate = new Date();
    this.subscriptions.set(subscriptionId, sub);
    this.logger.log(`Subscription cancelled: ${subscriptionId}`);
    return sub;
  }

  async calculateUsageBill(orgId: string, period: string): Promise<UsageReport> {
    const sub = await this.getSubscription(orgId);
    const tier = sub ? this.tiers.get(sub.tierId) : undefined;

    // In production, this would query actual usage data
    const mockUsage = {
      transactions: 150,
      apiCalls: 5000,
      storageUsedGB: 12,
      users: 5,
    };

    const subscriptionFee = tier ? tier.monthlyFee * (sub?.billingCycle === 'annual' ? 10 : 1) : 0;
    const transactionFee = tier ? mockUsage.transactions * (tier.transactionFeePercent / 100) : 0;
    const overageFee = this.calculateOverage(tier, mockUsage);

    return {
      orgId,
      period,
      ...mockUsage,
      fees: {
        subscription: subscriptionFee,
        transaction: Math.round(transactionFee * 100) / 100,
        overage: overageFee,
        total: Math.round((subscriptionFee + transactionFee + overageFee) * 100) / 100,
      },
    };
  }

  async checkFeatureAccess(orgId: string, feature: string): Promise<boolean> {
    const sub = await this.getSubscription(orgId);
    if (!sub) return false;

    const tier = this.tiers.get(sub.tierId);
    if (!tier) return false;

    return tier.features.includes(feature);
  }

  private calculateOverage(tier: PricingTier | undefined, usage: { transactions: number; apiCalls: number; storageUsedGB: number }): number {
    if (!tier) return 0;

    let overage = 0;
    if (usage.transactions > tier.limits.maxTransactions) {
      overage += (usage.transactions - tier.limits.maxTransactions) * 0.5;
    }
    if (usage.apiCalls > tier.limits.apiCallsPerMonth) {
      overage += ((usage.apiCalls - tier.limits.apiCallsPerMonth) / 1000) * 1;
    }
    if (usage.storageUsedGB > tier.limits.maxStorageGB) {
      overage += (usage.storageUsedGB - tier.limits.maxStorageGB) * 2;
    }

    return Math.round(overage * 100) / 100;
  }

  private initializeTiers(): void {
    const tiers: PricingTier[] = [
      {
        id: 'starter',
        name: 'Starter',
        description: 'For small traders and cooperatives',
        monthlyFee: 0,
        transactionFeePercent: 2.5,
        features: [
          'rfq_creation',
          'basic_messaging',
          'deal_tracking',
          'document_upload',
          'basic_analytics',
        ],
        limits: {
          maxUsers: 3,
          maxTransactions: 50,
          maxStorageGB: 5,
          apiCallsPerMonth: 1000,
        },
        support: 'community',
        sla: {
          uptimePercent: 99.0,
          responseTimeHours: 72,
          resolutionTimeHours: 168,
        },
        active: true,
      },
      {
        id: 'growth',
        name: 'Growth',
        description: 'For growing exporters and importers',
        monthlyFee: 299,
        transactionFeePercent: 1.5,
        features: [
          'rfq_creation',
          'advanced_messaging',
          'deal_tracking',
          'document_upload',
          'advanced_analytics',
          'compliance_dashboard',
          'insurance_referrals',
          'priority_support',
        ],
        limits: {
          maxUsers: 10,
          maxTransactions: 500,
          maxStorageGB: 50,
          apiCallsPerMonth: 10000,
        },
        support: 'email',
        sla: {
          uptimePercent: 99.5,
          responseTimeHours: 24,
          resolutionTimeHours: 72,
        },
        active: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations and traders',
        monthlyFee: 999,
        transactionFeePercent: 0.75,
        features: [
          'rfq_creation',
          'advanced_messaging',
          'deal_tracking',
          'document_upload',
          'advanced_analytics',
          'compliance_dashboard',
          'insurance_referrals',
          'trade_finance_referrals',
          'custom_integrations',
          'dedicated_support',
          'sla_guarantee',
          'white_label',
        ],
        limits: {
          maxUsers: 100,
          maxTransactions: 10000,
          maxStorageGB: 500,
          apiCallsPerMonth: 100000,
        },
        support: 'dedicated',
        sla: {
          uptimePercent: 99.9,
          responseTimeHours: 2,
          resolutionTimeHours: 8,
        },
        active: true,
      },
    ];

    for (const tier of tiers) {
      this.tiers.set(tier.id, tier);
    }
  }
}
