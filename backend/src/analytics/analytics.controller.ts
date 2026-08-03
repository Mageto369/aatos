import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('organization/:orgId')
  async getOrganizationAnalytics(@Param('orgId') orgId: string) {
    return this.analyticsService.getOrganizationAnalytics(orgId);
  }

  @Get('corridors')
  async getTopCorridors() {
    return this.analyticsService.getTopCorridors();
  }

  @Get('products')
  async getTopProducts() {
    return this.analyticsService.getTopProducts();
  }

  @Get('growth')
  async getMonthlyGrowth() {
    return this.analyticsService.getMonthlyGrowth();
  }
}
