import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { EnterprisePricingService } from './enterprise-pricing.service';
import { ESGReportingService } from './esg-reporting.service';
import { WhiteLabelService } from './white-label.service';
import { PartnerApiService } from './partner-api.service';
import { GovernmentTradeService } from './government-trade.service';
import { MatchingEngineService } from './matching-engine.service';

/**
 * Enterprise routes take the organization from the path. Without a caller the
 * handler cannot tell whose data it is returning — GET api-keys/:orgId had no
 * @Roles and no request, so any authenticated user could read any
 * organization's API keys.
 */
/**
 * The caller's organization, for routes that used to take an orgId in the
 * request body. A body-supplied orgId is hearsay: the four POST routes here
 * created a subscription, a white-label config, an API key, a webhook and a
 * government filing under whatever organization the caller named, and @Roles
 * only asserted they were an owner or admin of *some* organization. The route
 * audit cannot see this shape — it only knows about ids in the path — so these
 * were never on its list.
 */
function callerOrg(req: any): string {
  const orgId = req?.user?.orgId;
  if (!orgId) {
    throw new ForbiddenException('No organization on this account');
  }
  return orgId;
}

function assertOwnOrg(req: any, orgId: string): void {
  if (req?.user?.role === 'platform_admin') return;
  if (req?.user?.orgId !== orgId) {
    throw new ForbiddenException('You do not have access to this organization');
  }
}

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
  @Roles('owner', 'admin')
  async createSubscription(
    @Body() data: { tierId: string; billingCycle?: 'monthly' | 'annual' },
    @Request() req: any,
  ) {
    return this.pricingService.createSubscription(
      callerOrg(req),
      data.tierId,
      data.billingCycle,
    );
  }

  @Get('subscriptions/:orgId')
  @ApiOperation({ summary: 'Get organization subscription' })
  async getSubscription(@Param('orgId') orgId: string, @Request() req: any) {
    assertOwnOrg(req, orgId);
    return this.pricingService.getSubscription(orgId);
  }

  // ESG
  @Post('esg/carbon')
  @ApiOperation({ summary: 'Calculate carbon footprint' })
  @Roles('owner', 'admin', 'operator', 'compliance_officer')
  async calculateCarbon(@Body() data: Parameters<ESGReportingService['calculateCarbonFootprint']>[0]) {
    return this.esgService.calculateCarbonFootprint(data);
  }

  @Get('esg/score/:orgId')
  @ApiOperation({ summary: 'Get sustainability score' })
  async getSustainabilityScore(@Param('orgId') orgId: string, @Request() req: any) {
    assertOwnOrg(req, orgId);
    return this.esgService.calculateSustainabilityScore(orgId);
  }

  @Get('esg/report/:orgId')
  @ApiOperation({ summary: 'Generate ESG report' })
  async getESGReport(
    @Param('orgId') orgId: string,
    @Query('period') period: string,
    @Request() req: any,
  ) {
    assertOwnOrg(req, orgId);
    return this.esgService.generateESGReport(orgId, period);
  }

  // White Label
  @Post('white-label')
  @ApiOperation({ summary: 'Create white-label config' })
  @Roles('owner', 'admin')
  async createWhiteLabel(
    @Body() data: { config: Parameters<WhiteLabelService['createConfig']>[1] },
    @Request() req: any,
  ) {
    return this.whiteLabelService.createConfig(callerOrg(req), data.config);
  }

  @Get('white-label/:orgId')
  @ApiOperation({ summary: 'Get white-label config' })
  async getWhiteLabel(@Param('orgId') orgId: string, @Request() req: any) {
    assertOwnOrg(req, orgId);
    return this.whiteLabelService.getConfigByOrg(orgId);
  }

  // Partner API
  @Post('api-keys')
  @ApiOperation({ summary: 'Create API key' })
  @Roles('owner', 'admin')
  async createApiKey(
    @Body() data: { name: string; scopes: string[] },
    @Request() req: any,
  ) {
    return this.partnerApiService.createApiKey(callerOrg(req), data.name, data.scopes);
  }

  @Get('api-keys/:orgId')
  @ApiOperation({ summary: 'List API keys' })
  async getApiKeys(@Param('orgId') orgId: string, @Request() req: any) {
    assertOwnOrg(req, orgId);
    return this.partnerApiService.getApiKeys(orgId);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create webhook' })
  @Roles('owner', 'admin')
  async createWebhook(
    @Body() data: { url: string; events: string[] },
    @Request() req: any,
  ) {
    return this.partnerApiService.createWebhook(callerOrg(req), data);
  }

  // Government Trade
  @Get('gov-systems')
  @ApiOperation({ summary: 'List government trade systems' })
  async getGovSystems(@Query('country') country?: string, @Query('type') type?: string) {
    return this.govTradeService.getSystems(country, type);
  }

  @Post('filings')
  @ApiOperation({ summary: 'Submit trade filing' })
  @Roles('owner', 'admin', 'compliance_officer')
  async submitFiling(
    @Body()
    data: {
      dealId: string;
      systemId: string;
      filingType: string;
      data: Record<string, unknown>;
    },
    @Request() req: any,
  ) {
    return this.govTradeService.submitFiling(
      callerOrg(req),
      data.dealId,
      data.systemId,
      data.filingType,
      data.data,
    );
  }

  // Matching Engine
  @Get('matches/buyer/:orgId')
  @ApiOperation({ summary: 'Find supplier matches for buyer' })
  async findMatchesForBuyer(
    @Param('orgId') orgId: string,
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    assertOwnOrg(req, orgId);
    return this.matchingService.findMatchesForBuyer(orgId, limit ? parseInt(limit, 10) : 10);
  }

  @Post('matching/index-supplier')
  @ApiOperation({ summary: 'Index supplier profile' })
  @Roles('owner', 'admin', 'operator')
  async indexSupplier(@Body() profile: Parameters<MatchingEngineService['indexSupplier']>[0]) {
    return this.matchingService.indexSupplier(profile);
  }

  @Post('matching/index-buyer')
  @ApiOperation({ summary: 'Index buyer profile' })
  @Roles('owner', 'admin', 'operator')
  async indexBuyer(@Body() profile: Parameters<MatchingEngineService['indexBuyer']>[0]) {
    return this.matchingService.indexBuyer(profile);
  }
}
