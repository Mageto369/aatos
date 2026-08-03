import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EnterprisePricingService } from './enterprise-pricing.service';
import { ESGReportingService } from './esg-reporting.service';
import { WhiteLabelService } from './white-label.service';
import { PartnerApiService } from './partner-api.service';
import { GovernmentTradeService } from './government-trade.service';
import { MatchingEngineService } from './matching-engine.service';

@ApiTags('Enterprise')
@Controller('enterprise')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class EnterpriseController {
  constructor(
    private readonly pricingService: EnterprisePricingService,
    private readonly esgService: ESGReportingService,
    private readonly whiteLabelService: WhiteLabelService,
    private readonly partnerApiService: PartnerApiService,
    private readonly govTradeService: GovernmentTradeService,
    private readonly matchingService: MatchingEngineService,
  ) {}

  // Pricing
  @Get('pricing/tiers')
  @ApiOperation({ summary: 'Get all pricing tiers' })
  async getPricingTiers() {
    return this.pricingService.getAllTiers();
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create subscription' })
  async createSubscription(@Body() data: { orgId: string; tierId: string; billingCycle?: 'monthly' | 'annual' }) {
    return this.pricingService.createSubscription(data.orgId, data.tierId, data.billingCycle);
  }

  @Get('subscriptions/:orgId')
  @ApiOperation({ summary: 'Get organization subscription' })
  async getSubscription(@Param('orgId') orgId: string) {
    return this.pricingService.getSubscription(orgId);
  }

  // ESG
  @Post('esg/carbon')
  @ApiOperation({ summary: 'Calculate carbon footprint' })
  async calculateCarbon(@Body() data: Parameters<ESGReportingService['calculateCarbonFootprint']>[0]) {
    return this.esgService.calculateCarbonFootprint(data);
  }

  @Get('esg/score/:orgId')
  @ApiOperation({ summary: 'Get sustainability score' })
  async getSustainabilityScore(@Param('orgId') orgId: string) {
    return this.esgService.calculateSustainabilityScore(orgId);
  }

  @Get('esg/report/:orgId')
  @ApiOperation({ summary: 'Generate ESG report' })
  async getESGReport(@Param('orgId') orgId: string, @Query('period') period: string) {
    return this.esgService.generateESGReport(orgId, period);
  }

  // White Label
  @Post('white-label')
  @ApiOperation({ summary: 'Create white-label config' })
  async createWhiteLabel(@Body() data: { orgId: string; config: Parameters<WhiteLabelService['createConfig']>[1] }) {
    return this.whiteLabelService.createConfig(data.orgId, data.config);
  }

  @Get('white-label/:orgId')
  @ApiOperation({ summary: 'Get white-label config' })
  async getWhiteLabel(@Param('orgId') orgId: string) {
    return this.whiteLabelService.getConfigByOrg(orgId);
  }

  // Partner API
  @Post('api-keys')
  @ApiOperation({ summary: 'Create API key' })
  async createApiKey(@Body() data: { orgId: string; name: string; scopes: string[] }) {
    return this.partnerApiService.createApiKey(data.orgId, data.name, data.scopes);
  }

  @Get('api-keys/:orgId')
  @ApiOperation({ summary: 'List API keys' })
  async getApiKeys(@Param('orgId') orgId: string) {
    return this.partnerApiService.getApiKeys(orgId);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create webhook' })
  async createWebhook(@Body() data: { orgId: string; url: string; events: string[] }) {
    return this.partnerApiService.createWebhook(data.orgId, data);
  }

  // Government Trade
  @Get('gov-systems')
  @ApiOperation({ summary: 'List government trade systems' })
  async getGovSystems(@Query('country') country?: string, @Query('type') type?: string) {
    return this.govTradeService.getSystems(country, type);
  }

  @Post('filings')
  @ApiOperation({ summary: 'Submit trade filing' })
  async submitFiling(@Body() data: { orgId: string; dealId: string; systemId: string; filingType: string; data: Record<string, unknown> }) {
    return this.govTradeService.submitFiling(data.orgId, data.dealId, data.systemId, data.filingType, data.data);
  }

  // Matching Engine
  @Get('matches/buyer/:orgId')
  @ApiOperation({ summary: 'Find supplier matches for buyer' })
  async findMatchesForBuyer(@Param('orgId') orgId: string, @Query('limit') limit?: string) {
    return this.matchingService.findMatchesForBuyer(orgId, limit ? parseInt(limit, 10) : 10);
  }

  @Post('matching/index-supplier')
  @ApiOperation({ summary: 'Index supplier profile' })
  async indexSupplier(@Body() profile: Parameters<MatchingEngineService['indexSupplier']>[0]) {
    return this.matchingService.indexSupplier(profile);
  }

  @Post('matching/index-buyer')
  @ApiOperation({ summary: 'Index buyer profile' })
  async indexBuyer(@Body() profile: Parameters<MatchingEngineService['indexBuyer']>[0]) {
    return this.matchingService.indexBuyer(profile);
  }
}
