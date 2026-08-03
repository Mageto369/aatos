import { Injectable, Logger } from '@nestjs/common';

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  rateLimit: number; // requests per minute
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  active: boolean;
}

export interface WebhookConfig {
  id: string;
  orgId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  lastDeliveredAt?: Date;
  deliveryAttempts: number;
  failedAttempts: number;
}

export interface ApiMetric {
  orgId: string;
  endpoint: string;
  method: string;
  requests: number;
  errors: number;
  avgResponseTime: number;
  period: string;
}

/**
 * Partner API & Developer Portal Service
 * Manages API keys, webhooks, and partner integrations.
 */
@Injectable()
export class PartnerApiService {
  private readonly logger = new Logger(PartnerApiService.name);
  private readonly apiKeys: Map<string, ApiKey> = new Map();
  private readonly webhooks: Map<string, WebhookConfig> = new Map();
  private readonly metrics: ApiMetric[] = [];

  async createApiKey(orgId: string, name: string, scopes: string[]): Promise<ApiKey> {
    const prefix = this.generatePrefix();
    const key = `${prefix}_${this.generateSecret()}`;

    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      orgId,
      name,
      key,
      prefix,
      scopes,
      rateLimit: 1000,
      createdAt: new Date(),
      active: true,
    };

    this.apiKeys.set(apiKey.id, apiKey);
    this.logger.log(`API key created for org ${orgId}: ${name}`);
    return apiKey;
  }

  async getApiKeys(orgId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter(k => k.orgId === orgId)
      .map(k => ({ ...k, key: `${k.prefix}_****` })); // Mask the key
  }

  async validateApiKey(key: string): Promise<ApiKey | undefined> {
    const prefix = key.split('_')[0];
    return Array.from(this.apiKeys.values()).find(
      k => k.prefix === prefix && k.key === key && k.active,
    );
  }

  async revokeApiKey(keyId: string): Promise<boolean> {
    const key = this.apiKeys.get(keyId);
    if (!key) return false;

    key.active = false;
    this.apiKeys.set(keyId, key);
    this.logger.log(`API key revoked: ${keyId}`);
    return true;
  }

  async createWebhook(orgId: string, data: { url: string; events: string[] }): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      orgId,
      url: data.url,
      secret: this.generateSecret(),
      events: data.events,
      active: true,
      createdAt: new Date(),
      deliveryAttempts: 0,
      failedAttempts: 0,
    };

    this.webhooks.set(webhook.id, webhook);
    this.logger.log(`Webhook created for org ${orgId}: ${data.url}`);
    return webhook;
  }

  async getWebhooks(orgId: string): Promise<WebhookConfig[]> {
    return Array.from(this.webhooks.values()).filter(w => w.orgId === orgId);
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    return this.webhooks.delete(webhookId);
  }

  async deliverWebhook(event: string, payload: unknown): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values()).filter(
      w => w.active && w.events.includes(event),
    );

    for (const webhook of relevantWebhooks) {
      try {
        // In production, this would make an HTTP POST to webhook.url
        // with the payload signed using webhook.secret
        webhook.deliveryAttempts++;
        webhook.lastDeliveredAt = new Date();
        this.webhooks.set(webhook.id, webhook);
        this.logger.debug(`Webhook delivered: ${event} to ${webhook.url}`);
      } catch (error) {
        webhook.failedAttempts++;
        this.webhooks.set(webhook.id, webhook);
        this.logger.error(`Webhook delivery failed: ${event} to ${webhook.url}`);
      }
    }
  }

  async recordMetric(metric: ApiMetric): Promise<void> {
    this.metrics.push(metric);
  }

  async getMetrics(orgId: string, period?: string): Promise<ApiMetric[]> {
    return this.metrics.filter(m => m.orgId === orgId && (!period || m.period === period));
  }

  async getApiDocumentation(): Promise<{
    version: string;
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
      parameters: unknown[];
      responses: Record<string, unknown>;
    }>;
  }> {
    return {
      version: '2.0.0',
      endpoints: [
        {
          path: '/v2/rfqs',
          method: 'GET',
          description: 'List RFQs',
          parameters: [],
          responses: { '200': { description: 'List of RFQs' } },
        },
        {
          path: '/v2/deals',
          method: 'GET',
          description: 'List deals',
          parameters: [],
          responses: { '200': { description: 'List of deals' } },
        },
        {
          path: '/v2/webhooks',
          method: 'POST',
          description: 'Register a webhook',
          parameters: [],
          responses: { '201': { description: 'Webhook created' } },
        },
      ],
    };
  }

  private generatePrefix(): string {
    return 'ak_' + Math.random().toString(36).substring(2, 10);
  }

  private generateSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
