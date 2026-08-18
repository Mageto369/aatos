import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SanctionsCheckResult {
  clean: boolean;
  matches: SanctionsMatch[];
  checkedAt: Date;
  source: string;
}

export interface SanctionsMatch {
  listName: string;
  entityName: string;
  matchType: 'exact' | 'partial' | 'alias';
  confidence: number;
  details: Record<string, unknown>;
}

/**
 * Sanctions Screening Service
 * Screens organizations and individuals against sanctions lists.
 * In production, integrates with OFAC, UN, EU sanctions lists via API.
 */
@Injectable()
export class SanctionsScreeningService {
  private readonly logger = new Logger(SanctionsScreeningService.name);

  // Simulated sanctions lists for development
  private readonly sanctionsLists = new Map<string, Set<string>>();

  constructor(private readonly config: ConfigService) {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new Error('Sanctions screening is simulated. Connect live OFAC/UN/EU lists before production.');
    }
    this.initializeLists();
  }

  /**
   * Screen an entity against all sanctions lists
   */
  async screenEntity(params: {
    name: string;
    aliases?: string[];
    country?: string;
    entityType: 'individual' | 'organization';
  }): Promise<SanctionsCheckResult> {
    const matches: SanctionsMatch[] = [];
    const namesToCheck = [params.name, ...(params.aliases || [])];

    for (const [listName, entries] of this.sanctionsLists) {
      for (const name of namesToCheck) {
        const normalized = this.normalize(name);
        for (const entry of entries) {
          const match = this.calculateMatch(normalized, entry);
          if (match.confidence > 0.8) {
            matches.push({
              listName,
              entityName: entry,
              matchType: match.exact ? 'exact' : 'partial',
              confidence: match.confidence,
              details: { normalized, country: params.country },
            });
          }
        }
      }
    }

    const result: SanctionsCheckResult = {
      clean: matches.length === 0,
      matches,
      checkedAt: new Date(),
      source: 'OFAC/UN/EU Consolidated Lists (simulated)',
    };

    if (!result.clean) {
      this.logger.warn(`Sanctions match found for ${params.name}: ${matches.length} matches`);
    }

    return result;
  }

  /**
   * Batch screen multiple entities
   */
  async batchScreen(entities: Array<{
    id: string;
    name: string;
    aliases?: string[];
    country?: string;
    entityType: 'individual' | 'organization';
  }>): Promise<Map<string, SanctionsCheckResult>> {
    const results = new Map<string, SanctionsCheckResult>();
    for (const entity of entities) {
      results.set(entity.id, await this.screenEntity(entity));
    }
    return results;
  }

  private initializeLists(): void {
    // Simulated OFAC SDN list entries
    this.sanctionsLists.set('OFAC-SDN', new Set([
      'al-shabaab', 'boko-haram', 'isis', 'al-qaeda',
      'm23', 'lord\'s resistance army', 'janjaweed',
    ]));

    // Simulated UN consolidated list
    this.sanctionsLists.set('UN-Consolidated', new Set([
      'taliban', 'al-qaida', 'osama bin laden',
    ]));

    // Simulated EU sanctions
    this.sanctionsLists.set('EU-Sanctions', new Set([
      'wagner group', 'private military company wagner',
    ]));
  }

  private normalize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateMatch(input: string, entry: string): { confidence: number; exact: boolean } {
    const normalizedEntry = this.normalize(entry);
    if (input === normalizedEntry) {
      return { confidence: 1.0, exact: true };
    }
    if (normalizedEntry.includes(input) || input.includes(normalizedEntry)) {
      const ratio = Math.min(input.length, normalizedEntry.length) / Math.max(input.length, normalizedEntry.length);
      return { confidence: ratio * 0.9, exact: false };
    }
    // Simple word overlap
    const inputWords = new Set(input.split(' '));
    const entryWords = normalizedEntry.split(' ');
    const overlap = entryWords.filter(w => inputWords.has(w)).length;
    const confidence = overlap / Math.max(inputWords.size, entryWords.length);
    return { confidence: confidence > 0.5 ? confidence * 0.8 : 0, exact: false };
  }
}
