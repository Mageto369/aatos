import { Injectable, Logger } from '@nestjs/common';

export interface ComplianceRuleUpdate {
  id: string;
  source: string;
  jurisdiction: string;
  ruleType: string;
  changeType: 'new' | 'modified' | 'removed';
  oldValue?: string;
  newValue?: string;
  effectiveDate: Date;
  detectedAt: Date;
  processed: boolean;
  processedAt?: Date;
}

export interface RuleSource {
  name: string;
  url: string;
  jurisdiction: string;
  checkInterval: number; // in hours
  lastChecked?: Date;
}

/**
 * Automated Compliance Rule Updates Service
 * Monitors regulatory sources for changes and alerts on updates.
 * Production path: integrate with regulatory APIs and web scraping.
 */
@Injectable()
export class ComplianceRuleUpdaterService {
  private readonly logger = new Logger(ComplianceRuleUpdaterService.name);
  private readonly sources: RuleSource[] = [];
  private readonly pendingUpdates: Map<string, ComplianceRuleUpdate> = new Map();

  constructor() {
    this.initializeSources();
  }

  async checkAllSources(): Promise<ComplianceRuleUpdate[]> {
    const updates: ComplianceRuleUpdate[] = [];

    for (const source of this.sources) {
      const sourceUpdates = await this.checkSource(source);
      updates.push(...sourceUpdates);
      source.lastChecked = new Date();
    }

    this.logger.log(`Checked ${this.sources.length} sources, found ${updates.length} updates`);
    return updates;
  }

  async checkSource(source: RuleSource): Promise<ComplianceRuleUpdate[]> {
    // In production, this would:
    // 1. Fetch the latest rules from the source URL
    // 2. Compare with previously stored rules
    // 3. Generate updates for any changes

    this.logger.debug(`Checking source: ${source.name}`);
    return []; // Simulated — no changes detected
  }

  async getPendingUpdates(): Promise<ComplianceRuleUpdate[]> {
    return Array.from(this.pendingUpdates.values())
      .filter(u => !u.processed)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  async processUpdate(updateId: string): Promise<ComplianceRuleUpdate | undefined> {
    const update = this.pendingUpdates.get(updateId);
    if (!update) return undefined;

    update.processed = true;
    update.processedAt = new Date();
    this.pendingUpdates.set(updateId, update);

    this.logger.log(`Compliance update processed: ${updateId} — ${update.ruleType} in ${update.jurisdiction}`);
    return update;
  }

  async addSource(source: RuleSource): Promise<void> {
    this.sources.push(source);
    this.logger.log(`Added compliance source: ${source.name}`);
  }

  async getSources(): Promise<RuleSource[]> {
    return this.sources;
  }

  async simulateUpdate(data: Omit<ComplianceRuleUpdate, 'id' | 'detectedAt' | 'processed'>): Promise<ComplianceRuleUpdate> {
    const update: ComplianceRuleUpdate = {
      ...data,
      id: crypto.randomUUID(),
      detectedAt: new Date(),
      processed: false,
    };
    this.pendingUpdates.set(update.id, update);
    this.logger.warn(`Simulated compliance update: ${update.ruleType} in ${update.jurisdiction} (${update.changeType})`);
    return update;
  }

  private initializeSources(): void {
    this.sources.push(
      {
        name: 'USDA National Organic Program',
        url: 'https://www.ams.usda.gov/rules-regulations/organic',
        jurisdiction: 'US',
        checkInterval: 168, // weekly
      },
      {
        name: 'Kenya Plant Health Inspectorate Service',
        url: 'https://www.kephis.org/index.php/regulations',
        jurisdiction: 'KE',
        checkInterval: 168,
      },
      {
        name: 'U.S. CBP Trade Regulations',
        url: 'https://www.cbp.gov/trade/rulings',
        jurisdiction: 'US',
        checkInterval: 72, // every 3 days
      },
      {
        name: 'EAC-EU EPA Updates',
        url: 'https://www.eala.org/eac-eu-epa',
        jurisdiction: 'EAC',
        checkInterval: 168,
      },
      {
        name: 'Fairtrade International Standards',
        url: 'https://www.fairtrade.net/standard/',
        jurisdiction: 'INT',
        checkInterval: 168,
      },
    );
  }
}
