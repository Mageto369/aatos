import { Injectable, Logger } from '@nestjs/common';

export interface SearchableEntity {
  id: string;
  type: 'product' | 'organization' | 'rfq' | 'deal' | 'quotation';
  title: string;
  description: string;
  tags: string[];
  metadata: Record<string, unknown>;
  score?: number;
}

export interface SearchFilters {
  type?: string[];
  country?: string[];
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchResult {
  results: SearchableEntity[];
  total: number;
  facets: Record<string, Array<{ value: string; count: number }>>;
  query: string;
  executionTime: number;
}

/**
 * Advanced Search Service
 * Faceted search, relevance ranking, and autocomplete for AATOS entities.
 * Production path: integrate Elasticsearch or Algolia.
 */
@Injectable()
export class AdvancedSearchService {
  private readonly logger = new Logger(AdvancedSearchService.name);
  private readonly index: Map<string, SearchableEntity> = new Map();

  async indexEntity(entity: SearchableEntity): Promise<void> {
    this.index.set(`${entity.type}:${entity.id}`, entity);
    this.logger.debug(`Indexed: ${entity.type}:${entity.id}`);
  }

  async removeFromIndex(type: string, id: string): Promise<void> {
    this.index.delete(`${type}:${id}`);
    this.logger.debug(`Removed from index: ${type}:${id}`);
  }

  async search(query: string, filters?: SearchFilters, limit: number = 20): Promise<SearchResult> {
    const startTime = Date.now();
    const results: SearchableEntity[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entity of this.index.values()) {
      // Apply type filter
      if (filters?.type && !filters.type.includes(entity.type)) continue;

      // Apply text search
      const matchesQuery =
        entity.title.toLowerCase().includes(lowerQuery) ||
        entity.description.toLowerCase().includes(lowerQuery) ||
        entity.tags.some(t => t.toLowerCase().includes(lowerQuery));

      if (!matchesQuery) continue;

      // Apply additional filters
      if (filters?.country && !filters.country.includes(entity.metadata.country as string)) continue;
      if (filters?.category && !filters.category.includes(entity.metadata.category as string)) continue;
      if (filters?.status && !filters.status.includes(entity.metadata.status as string)) continue;

      if (filters?.minPrice && (entity.metadata.price as number) < filters.minPrice) continue;
      if (filters?.maxPrice && (entity.metadata.price as number) > filters.maxPrice) continue;

      if (filters?.dateFrom && new Date(entity.metadata.createdAt as string) < filters.dateFrom) continue;
      if (filters?.dateTo && new Date(entity.metadata.createdAt as string) > filters.dateTo) continue;

      // Calculate relevance score
      const score = this.calculateScore(entity, query);
      results.push({ ...entity, score });
    }

    // Sort by score descending
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Generate facets
    const facets = this.generateFacets(results);

    const executionTime = Date.now() - startTime;
    this.logger.log(`Search: "${query}" returned ${results.length} results in ${executionTime}ms`);

    return {
      results: results.slice(0, limit),
      total: results.length,
      facets,
      query,
      executionTime,
    };
  }

  async autocomplete(prefix: string, type?: string, limit: number = 10): Promise<string[]> {
    const lowerPrefix = prefix.toLowerCase();
    const suggestions = new Set<string>();

    for (const entity of this.index.values()) {
      if (type && entity.type !== type) continue;

      const words = [
        entity.title,
        entity.description,
        ...entity.tags,
      ]
        .join(' ')
        .split(/\s+/)
        .map(w => w.toLowerCase());

      for (const word of words) {
        if (word.startsWith(lowerPrefix) && word.length > lowerPrefix.length) {
          suggestions.add(word);
        }
      }
    }

    return Array.from(suggestions).slice(0, limit);
  }

  async getFacets(type?: string): Promise<SearchResult['facets']> {
    const entities = type
      ? Array.from(this.index.values()).filter(e => e.type === type)
      : Array.from(this.index.values());

    return this.generateFacets(entities);
  }

  private calculateScore(entity: SearchableEntity, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Title match is highest weight
    if (entity.title.toLowerCase().includes(lowerQuery)) {
      score += 10;
      // Exact title match is even better
      if (entity.title.toLowerCase() === lowerQuery) score += 5;
    }

    // Description match
    if (entity.description.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }

    // Tag match
    const tagMatches = entity.tags.filter(t => t.toLowerCase().includes(lowerQuery)).length;
    score += tagMatches * 3;

    // Boost recent items
    const age = Date.now() - new Date(entity.metadata.createdAt as string).getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);
    if (ageDays < 7) score += 2;
    else if (ageDays < 30) score += 1;

    return score;
  }

  private generateFacets(results: SearchableEntity[]): SearchResult['facets'] {
    const facets: SearchResult['facets'] = {
      type: [],
      country: [],
      category: [],
      status: [],
    };

    const counts: Record<string, Map<string, number>> = {
      type: new Map(),
      country: new Map(),
      category: new Map(),
      status: new Map(),
    };

    for (const entity of results) {
      this.incrementCount(counts.type, entity.type);
      this.incrementCount(counts.country, entity.metadata.country as string);
      this.incrementCount(counts.category, entity.metadata.category as string);
      this.incrementCount(counts.status, entity.metadata.status as string);
    }

    for (const [key, map] of Object.entries(counts)) {
      facets[key] = Array.from(map.entries())
        .filter(([value]) => value !== undefined && value !== null)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    }

    return facets;
  }

  private incrementCount(map: Map<string, number>, value?: string): void {
    if (!value) return;
    map.set(value, (map.get(value) || 0) + 1);
  }
}
