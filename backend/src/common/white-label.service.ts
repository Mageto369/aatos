import { Injectable, Logger } from '@nestjs/common';

export interface WhiteLabelConfig {
  id: string;
  orgId: string;
  enabled: boolean;
  branding: {
    appName: string;
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  domain: {
    customDomain?: string;
    useCustomDomain: boolean;
    sslEnabled: boolean;
  };
  features: {
    showPoweredBy: boolean;
    customLoginPage: boolean;
    customEmailTemplates: boolean;
    coBrandedDocuments: boolean;
  };
  content: {
    homepageHero?: string;
    aboutPage?: string;
    contactEmail?: string;
    supportUrl?: string;
    termsUrl?: string;
    privacyUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * White-Label Service
 * Manages multi-tenant branding and custom domain configuration.
 */
@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);
  private readonly configs: Map<string, WhiteLabelConfig> = new Map();

  async createConfig(orgId: string, data: Omit<WhiteLabelConfig, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<WhiteLabelConfig> {
    const config: WhiteLabelConfig = {
      ...data,
      id: crypto.randomUUID(),
      orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.configs.set(config.id, config);
    this.logger.log(`White-label config created for org: ${orgId}`);
    return config;
  }

  async getConfigByOrg(orgId: string): Promise<WhiteLabelConfig | undefined> {
    return Array.from(this.configs.values()).find(c => c.orgId === orgId);
  }

  async updateConfig(orgId: string, updates: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig | undefined> {
    const config = await this.getConfigByOrg(orgId);
    if (!config) return undefined;

    const updated = { ...config, ...updates, updatedAt: new Date() };
    this.configs.set(config.id, updated);
    this.logger.log(`White-label config updated for org: ${orgId}`);
    return updated;
  }

  async validateDomain(customDomain: string): Promise<{ valid: boolean; message: string }> {
    // In production, this would:
    // 1. Check DNS records point to our infrastructure
    // 2. Verify SSL certificate can be provisioned
    // 3. Check domain is not already in use

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(customDomain)) {
      return { valid: false, message: 'Invalid domain format' };
    }

    return { valid: true, message: 'Domain is valid and available' };
  }

  async getBrandingForDomain(domain: string): Promise<WhiteLabelConfig['branding'] | undefined> {
    const config = Array.from(this.configs.values()).find(
      c => c.domain.customDomain === domain && c.enabled,
    );
    return config?.branding;
  }

  async getDefaultBranding(): Promise<WhiteLabelConfig['branding']> {
    return {
      appName: 'AATOS',
      logoUrl: 'https://assets.aatos.io/logo.png',
      faviconUrl: 'https://assets.aatos.io/favicon.ico',
      primaryColor: '#2E7D32',
      secondaryColor: '#1565C0',
      accentColor: '#F9A825',
      fontFamily: 'Inter',
    };
  }
}
