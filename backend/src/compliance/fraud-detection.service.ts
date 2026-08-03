import { Injectable, Logger } from '@nestjs/common';

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: FraudFlag[];
  action: 'allow' | 'review' | 'block';
}

export interface FraudFlag {
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  data: Record<string, unknown>;
}

export interface TransactionContext {
  userId: string;
  orgId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  previousTransactions: number;
  accountAgeDays: number;
}

/**
 * Fraud Detection Service
 * Rule-based fraud detection with configurable risk thresholds.
 */
@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  // Risk thresholds
  private readonly THRESHOLDS = {
    allow: 30,
    review: 70,
    block: 90,
  };

  async evaluateTransaction(context: TransactionContext): Promise<FraudCheckResult> {
    const flags: FraudFlag[] = [];

    // Rule 1: Velocity check — more than 5 transactions in 1 hour
    if (context.previousTransactions > 5) {
      flags.push({
        ruleId: 'VEL-001',
        ruleName: 'High Transaction Velocity',
        severity: 'medium',
        description: `User has ${context.previousTransactions} recent transactions`,
        data: { transactionCount: context.previousTransactions },
      });
    }

    // Rule 2: Amount check — unusually large transaction
    if (context.amount > 100000) {
      flags.push({
        ruleId: 'AMT-001',
        ruleName: 'Large Transaction Amount',
        severity: 'medium',
        description: `Transaction amount ${context.currency} ${context.amount} exceeds threshold`,
        data: { amount: context.amount, threshold: 100000 },
      });
    }

    // Rule 3: New account — account less than 7 days old
    if (context.accountAgeDays < 7) {
      flags.push({
        ruleId: 'ACC-001',
        ruleName: 'New Account',
        severity: 'low',
        description: `Account is only ${context.accountAgeDays} days old`,
        data: { accountAgeDays: context.accountAgeDays },
      });
    }

    // Rule 4: Rapid account creation + immediate transaction
    if (context.accountAgeDays < 1 && context.amount > 1000) {
      flags.push({
        ruleId: 'ACC-002',
        ruleName: 'Immediate High-Value Transaction',
        severity: 'high',
        description: 'High-value transaction from account created today',
        data: { accountAgeDays: context.accountAgeDays, amount: context.amount },
      });
    }

    // Rule 5: Suspicious payment method combination
    if (context.paymentMethod === 'mobile_money' && context.amount > 50000) {
      flags.push({
        ruleId: 'PAY-001',
        ruleName: 'Mobile Money Large Amount',
        severity: 'medium',
        description: 'Large amount via mobile money',
        data: { paymentMethod: context.paymentMethod, amount: context.amount },
      });
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(flags);
    const riskLevel = this.getRiskLevel(riskScore);
    const action = this.getAction(riskScore);

    if (flags.length > 0) {
      this.logger.warn(`Fraud flags detected for user ${context.userId}: ${flags.length} flags, score ${riskScore}`);
    }

    return {
      riskScore,
      riskLevel,
      flags,
      action,
    };
  }

  async evaluateRFQ(context: {
    orgId: string;
    quantity: number;
    pricePerUnit: number;
    originCountry: string;
    previousRFQs: number;
    orgAgeDays: number;
  }): Promise<FraudCheckResult> {
    const flags: FraudFlag[] = [];

    // Rule: Unusually large RFQ from new org
    if (context.orgAgeDays < 14 && context.quantity > 100000) {
      flags.push({
        ruleId: 'RFQ-001',
        ruleName: 'Large RFQ from New Organization',
        severity: 'medium',
        description: `New org (${context.orgAgeDays} days) requesting ${context.quantity} units`,
        data: { orgAgeDays: context.orgAgeDays, quantity: context.quantity },
      });
    }

    // Rule: Price significantly below market
    if (context.pricePerUnit < 1) {
      flags.push({
        ruleId: 'RFQ-002',
        ruleName: 'Suspiciously Low Price',
        severity: 'high',
        description: `Price ${context.pricePerUnit} per unit is below minimum threshold`,
        data: { pricePerUnit: context.pricePerUnit },
      });
    }

    const riskScore = this.calculateRiskScore(flags);
    return {
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      flags,
      action: this.getAction(riskScore),
    };
  }

  private calculateRiskScore(flags: FraudFlag[]): number {
    if (flags.length === 0) return 0;

    const severityWeights = { low: 10, medium: 25, high: 50 };
    const totalWeight = flags.reduce((sum, flag) => sum + severityWeights[flag.severity], 0);
    return Math.min(100, totalWeight);
  }

  private getRiskLevel(score: number): FraudCheckResult['riskLevel'] {
    if (score >= this.THRESHOLDS.block) return 'critical';
    if (score >= this.THRESHOLDS.review) return 'high';
    if (score >= this.THRESHOLDS.allow) return 'medium';
    return 'low';
  }

  private getAction(score: number): FraudCheckResult['action'] {
    if (score >= this.THRESHOLDS.block) return 'block';
    if (score >= this.THRESHOLDS.review) return 'review';
    return 'allow';
  }
}
