import { Injectable, Logger } from '@nestjs/common';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'warning' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertRule['severity'];
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Monitoring & Alerting Service
 * Basic health checks and alerting for AATOS infrastructure.
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly healthChecks: Map<string, HealthCheck> = new Map();
  private readonly alertRules: Map<string, AlertRule> = new Map();
  private readonly alerts: Map<string, Alert> = new Map();

  constructor() {
    this.initializeAlertRules();
  }

  async recordHealthCheck(check: Omit<HealthCheck, 'lastChecked'>): Promise<HealthCheck> {
    const healthCheck: HealthCheck = {
      ...check,
      lastChecked: new Date(),
    };
    this.healthChecks.set(check.name, healthCheck);

    if (check.status === 'unhealthy') {
      this.logger.error(`Health check failed: ${check.name} — ${check.message}`);
    } else if (check.status === 'degraded') {
      this.logger.warn(`Health check degraded: ${check.name} — ${check.message}`);
    }

    return healthCheck;
  }

  async getHealthChecks(): Promise<HealthCheck[]> {
    return Array.from(this.healthChecks.values());
  }

  async getOverallHealth(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; checks: HealthCheck[] }> {
    const checks = await this.getHealthChecks();
    const unhealthy = checks.filter(c => c.status === 'unhealthy');
    const degraded = checks.filter(c => c.status === 'degraded');

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthy.length > 0) status = 'unhealthy';
    else if (degraded.length > 0) status = 'degraded';

    return { status, checks };
  }

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const newRule: AlertRule = { ...rule, id: crypto.randomUUID() };
    this.alertRules.set(newRule.id, newRule);
    this.logger.log(`Alert rule created: ${newRule.name}`);
    return newRule;
  }

  async evaluateAlertRules(metrics: Record<string, number>): Promise<Alert[]> {
    const triggered: Alert[] = [];

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const value = metrics[rule.condition];
      if (value === undefined) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) continue;
      }

      if (value >= rule.threshold) {
        const alert: Alert = {
          id: crypto.randomUUID(),
          ruleId: rule.id,
          severity: rule.severity,
          message: `${rule.name}: ${rule.condition} = ${value} (threshold: ${rule.threshold})`,
          timestamp: new Date(),
          resolved: false,
        };
        this.alerts.set(alert.id, alert);
        triggered.push(alert);

        rule.lastTriggered = new Date();
        this.alertRules.set(rule.id, rule);

        this.logger.warn(`Alert triggered: ${alert.message}`);
      }
    }

    return triggered;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(a => !a.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async resolveAlert(alertId: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(alertId);
    if (!alert) return undefined;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    this.alerts.set(alertId, alert);
    this.logger.log(`Alert resolved: ${alertId}`);
    return alert;
  }

  async getAlertHistory(limit: number = 50): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private initializeAlertRules(): void {
    const rules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'High Error Rate',
        condition: 'error_rate',
        threshold: 5, // 5% error rate
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        name: 'High Response Time',
        condition: 'response_time_p95',
        threshold: 2000, // 2 seconds
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 10,
      },
      {
        name: 'Low Disk Space',
        condition: 'disk_usage_percent',
        threshold: 85, // 85% disk usage
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30,
      },
      {
        name: 'Database Connection Pool Exhausted',
        condition: 'db_pool_usage',
        threshold: 90, // 90% pool usage
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        name: 'Payment Failure Spike',
        condition: 'payment_failure_rate',
        threshold: 10, // 10% failure rate
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 20,
      },
    ];

    for (const rule of rules) {
      this.createAlertRule(rule);
    }
  }
}
