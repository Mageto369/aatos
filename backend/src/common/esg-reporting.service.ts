import { Injectable, Logger } from '@nestjs/common';

export interface CarbonFootprint {
  id: string;
  orgId: string;
  dealId?: string;
  productId?: string;
  transportMode: 'air' | 'sea' | 'road' | 'rail';
  origin: string;
  destination: string;
  distanceKm: number;
  weightKg: number;
  carbonKg: number;
  calculationMethod: string;
  calculatedAt: Date;
}

export interface SustainabilityScore {
  orgId: string;
  overall: number; // 0-100
  categories: {
    carbon: number;
    water: number;
    biodiversity: number;
    labor: number;
    community: number;
  };
  certifications: string[];
  lastUpdated: Date;
}

export interface ESGReport {
  orgId: string;
  period: string; // e.g., "2026-Q2"
  carbonEmissions: {
    totalKg: number;
    perUnitKg: number;
    trend: 'improving' | 'stable' | 'worsening';
  };
  waterUsage: {
    totalLiters: number;
    perUnitLiters: number;
  };
  wasteReduction: {
    percentRecycled: number;
    packagingSustainability: number;
  };
  socialImpact: {
    fairWagePercent: number;
    womenInWorkforce: number;
    trainingHours: number;
  };
  recommendations: string[];
}

/**
 * ESG / Sustainability Reporting Service
 * Tracks carbon footprint, sustainability scores, and generates ESG reports.
 */
@Injectable()
export class ESGReportingService {
  private readonly logger = new Logger(ESGReportingService.name);
  private readonly carbonData: Map<string, CarbonFootprint> = new Map();
  private readonly scores: Map<string, SustainabilityScore> = new Map();

  // Emission factors (kg CO2 per ton-km)
  private readonly emissionFactors: Record<string, number> = {
    air: 0.6,
    sea: 0.012,
    road: 0.06,
    rail: 0.02,
  };

  async calculateCarbonFootprint(data: Omit<CarbonFootprint, 'id' | 'carbonKg' | 'calculatedAt'>): Promise<CarbonFootprint> {
    const factor = this.emissionFactors[data.transportMode] || 0.06;
    const weightTons = data.weightKg / 1000;
    const carbonKg = Math.round(data.distanceKm * weightTons * factor * 100) / 100;

    const footprint: CarbonFootprint = {
      ...data,
      id: crypto.randomUUID(),
      carbonKg,
      calculatedAt: new Date(),
    };

    this.carbonData.set(footprint.id, footprint);
    this.logger.log(`Carbon footprint calculated: ${carbonKg}kg for ${data.transportMode} transport`);
    return footprint;
  }

  async getCarbonByDeal(dealId: string): Promise<CarbonFootprint[]> {
    return Array.from(this.carbonData.values()).filter(c => c.dealId === dealId);
  }

  async getCarbonByOrg(orgId: string, period?: string): Promise<CarbonFootprint[]> {
    let results = Array.from(this.carbonData.values()).filter(c => c.orgId === orgId);
    if (period) {
      const [year, quarter] = period.split('-');
      results = results.filter(c => {
        const d = c.calculatedAt;
        const q = Math.floor(d.getMonth() / 3) + 1;
        return d.getFullYear().toString() === year && `Q${q}` === quarter;
      });
    }
    return results;
  }

  async calculateSustainabilityScore(orgId: string): Promise<SustainabilityScore> {
    const carbonRecords = await this.getCarbonByOrg(orgId);
    const totalCarbon = carbonRecords.reduce((sum, c) => sum + c.carbonKg, 0);

    // Calculate score components (simplified)
    const carbonScore = Math.max(0, 100 - (totalCarbon / 1000));
    const waterScore = 75; // Placeholder — would integrate with water usage data
    const biodiversityScore = 80; // Placeholder
    const laborScore = 85; // Placeholder
    const communityScore = 70; // Placeholder

    const overall = Math.round(
      (carbonScore * 0.3 + waterScore * 0.2 + biodiversityScore * 0.2 + laborScore * 0.15 + communityScore * 0.15)
    );

    const score: SustainabilityScore = {
      orgId,
      overall,
      categories: {
        carbon: Math.round(carbonScore),
        water: waterScore,
        biodiversity: biodiversityScore,
        labor: laborScore,
        community: communityScore,
      },
      certifications: [],
      lastUpdated: new Date(),
    };

    this.scores.set(orgId, score);
    return score;
  }

  async getSustainabilityScore(orgId: string): Promise<SustainabilityScore | undefined> {
    return this.scores.get(orgId);
  }

  async generateESGReport(orgId: string, period: string): Promise<ESGReport> {
    const carbonRecords = await this.getCarbonByOrg(orgId, period);
    const totalCarbon = carbonRecords.reduce((sum, c) => sum + c.carbonKg, 0);
    const score = await this.getSustainabilityScore(orgId);

    const report: ESGReport = {
      orgId,
      period,
      carbonEmissions: {
        totalKg: Math.round(totalCarbon * 100) / 100,
        perUnitKg: carbonRecords.length > 0 ? Math.round((totalCarbon / carbonRecords.length) * 100) / 100 : 0,
        trend: score && score.categories.carbon > 70 ? 'improving' : 'stable',
      },
      waterUsage: {
        totalLiters: 0,
        perUnitLiters: 0,
      },
      wasteReduction: {
        percentRecycled: 0,
        packagingSustainability: 0,
      },
      socialImpact: {
        fairWagePercent: 0,
        womenInWorkforce: 0,
        trainingHours: 0,
      },
      recommendations: this.generateRecommendations(score),
    };

    return report;
  }

  async getIndustryBenchmark(): Promise<{
    averageCarbonPerTonKm: number;
    averageSustainabilityScore: number;
    topPerformers: string[];
  }> {
    return {
      averageCarbonPerTonKm: 0.045,
      averageSustainabilityScore: 72,
      topPerformers: ['org-1', 'org-2', 'org-3'],
    };
  }

  private generateRecommendations(score?: SustainabilityScore): string[] {
    const recommendations: string[] = [];

    if (!score) {
      return ['Start tracking sustainability metrics to receive personalized recommendations.'];
    }

    if (score.categories.carbon < 60) {
      recommendations.push('Consider switching to sea freight for lower carbon emissions.');
      recommendations.push('Optimize shipping routes to reduce transport distance.');
    }
    if (score.categories.water < 60) {
      recommendations.push('Implement water recycling systems in processing facilities.');
    }
    if (score.categories.labor < 70) {
      recommendations.push('Review wage structures to ensure fair compensation.');
    }
    if (score.overall < 50) {
      recommendations.push('Consider obtaining sustainability certifications (Rainforest Alliance, Fairtrade).');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current sustainability practices. Consider setting more ambitious targets.');
    }

    return recommendations;
  }
}
