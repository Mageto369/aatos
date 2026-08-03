import { Injectable, Logger } from '@nestjs/common';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  type: 'boolean' | 'percentage' | 'user_segment';
  percentage?: number; // 0-100 for percentage rollout
  allowedUsers?: string[];
  allowedOrgs?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagEvaluation {
  key: string;
  enabled: boolean;
  reason: string;
}

/**
 * Feature Flag Service
 * Manages feature flags for safe rollouts and A/B testing.
 */
@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.initializeFlags();
  }

  async isEnabled(key: string, context?: { userId?: string; orgId?: string }): Promise<boolean> {
    const flag = this.flags.get(key);
    if (!flag) {
      this.logger.warn(`Feature flag not found: ${key}`);
      return false;
    }

    if (!flag.enabled) return false;

    switch (flag.type) {
      case 'boolean':
        return flag.enabled;
      case 'percentage':
        return this.evaluatePercentage(flag, context);
      case 'user_segment':
        return this.evaluateUserSegment(flag, context);
      default:
        return false;
    }
  }

  async evaluateFlag(key: string, context?: { userId?: string; orgId?: string }): Promise<FeatureFlagEvaluation> {
    const flag = this.flags.get(key);
    if (!flag) {
      return { key, enabled: false, reason: 'flag_not_found' };
    }

    const enabled = await this.isEnabled(key, context);
    let reason = 'enabled';

    if (!flag.enabled) reason = 'flag_disabled';
    else if (flag.type === 'percentage' && !enabled) reason = 'percentage_excluded';
    else if (flag.type === 'user_segment' && !enabled) reason = 'segment_excluded';

    return { key, enabled, reason };
  }

  async createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.flags.set(flag.key, newFlag);
    this.logger.log(`Feature flag created: ${flag.key} (${flag.type})`);
    return newFlag;
  }

  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
    const flag = this.flags.get(key);
    if (!flag) return undefined;

    const updated = { ...flag, ...updates, updatedAt: new Date() };
    this.flags.set(key, updated);
    this.logger.log(`Feature flag updated: ${key}`);
    return updated;
  }

  async deleteFlag(key: string): Promise<boolean> {
    const deleted = this.flags.delete(key);
    if (deleted) this.logger.log(`Feature flag deleted: ${key}`);
    return deleted;
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  async getFlag(key: string): Promise<FeatureFlag | undefined> {
    return this.flags.get(key);
  }

  private evaluatePercentage(flag: FeatureFlag, context?: { userId?: string; orgId?: string }): boolean {
    if (!flag.percentage) return false;
    if (!context?.userId) return false;

    // Deterministic hash-based evaluation
    const hash = this.simpleHash(`${flag.key}:${context.userId}`);
    return (hash % 100) < flag.percentage;
  }

  private evaluateUserSegment(flag: FeatureFlag, context?: { userId?: string; orgId?: string }): boolean {
    if (flag.allowedUsers?.includes(context?.userId || '')) return true;
    if (flag.allowedOrgs?.includes(context?.orgId || '')) return true;
    return false;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private initializeFlags(): void {
    const initialFlags: FeatureFlag[] = [
      {
        key: 'new_quotation_flow',
        enabled: true,
        description: 'New quotation submission flow with auto-routing',
        type: 'boolean',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: 'mobile_money_payments',
        enabled: true,
        description: 'Enable mobile money payment method',
        type: 'boolean',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: 'advanced_analytics',
        enabled: false,
        description: 'Advanced analytics dashboard with predictive insights',
        type: 'percentage',
        percentage: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: 'trade_finance_referral',
        enabled: true,
        description: 'Trade finance partner referrals',
        type: 'boolean',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: 'multi_currency_conversion',
        enabled: true,
        description: 'Real-time currency conversion engine',
        type: 'boolean',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const flag of initialFlags) {
      this.flags.set(flag.key, flag);
    }
  }
}
