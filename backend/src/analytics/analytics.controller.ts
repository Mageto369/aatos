import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiTags('Analytics')
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform dashboard stats' })
  @Roles('owner', 'admin')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('organization/:orgId')
  @ApiOperation({ summary: 'Organization analytics' })
  async getOrganizationAnalytics(@Param('orgId') orgId: string, @Request() req: any) {
    // Trade volume, deal counts and revenue for the named organization. It
    // took the id from the path with no request, so a competitor could read
    // another company's book by knowing its id — and organization ids are not
    // secret, the marketplace directory hands them out.
    if (req?.user?.role !== 'platform_admin' && req?.user?.orgId !== orgId) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.analyticsService.getOrganizationAnalytics(orgId);
  }

  @Get('corridors')
  @ApiOperation({ summary: 'Top trade corridors' })
  @Roles('owner', 'admin')
  async getTopCorridors() {
    return this.analyticsService.getTopCorridors();
  }

  @Get('products')
  @ApiOperation({ summary: 'Top products' })
  async getTopProducts() {
    return this.analyticsService.getTopProducts();
  }

  @Get('growth')
  @ApiOperation({ summary: 'Monthly growth metrics' })
  @Roles('owner', 'admin')
  async getMonthlyGrowth() {
    return this.analyticsService.getMonthlyGrowth();
  }
}
