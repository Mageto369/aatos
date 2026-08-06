import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { TradeFinanceService, TradeFinanceRequest } from './trade-finance.service';
import { LogisticsReferralService } from './logistics-referral.service';
import { InsuranceReferralService } from './insurance-referral.service';

@ApiTags('Referrals')
@Controller('referrals')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class ReferralsController {
  constructor(
    private readonly tradeFinanceService: TradeFinanceService,
    private readonly logisticsService: LogisticsReferralService,
    private readonly insuranceService: InsuranceReferralService,
  ) {}

  @Post('trade-finance')
  @ApiOperation({ summary: 'Find trade finance matches for a deal' })
  @Roles('owner', 'admin', 'operator')
  async findTradeFinanceMatches(@Body() request: TradeFinanceRequest) {
    return this.tradeFinanceService.findMatches(request);
  }

  @Get('trade-finance/partners')
  @ApiOperation({ summary: 'Get trade finance partners by product type' })
  async getTradeFinancePartners(@Query('productType') productType: string) {
    return this.tradeFinanceService.getPartnersByProduct(productType);
  }

  @Get('logistics')
  @ApiOperation({ summary: 'Find logistics partners for corridor' })
  @Roles('owner', 'admin', 'operator', 'logistics_officer')
  async findLogistics(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    return this.logisticsService.findPartnersForCorridor(origin, destination);
  }

  @Get('logistics/quote')
  @ApiOperation({ summary: 'Get logistics quote' })
  @Roles('owner', 'admin', 'operator', 'logistics_officer')
  async getLogisticsQuote(
    @Query('partnerId') partnerId: string,
    @Query('weightKg') weightKg: number,
  ) {
    return this.logisticsService.getQuote(partnerId, {
      dealId: '',
      orgId: '',
      origin: '',
      destination: '',
      productType: '',
      quantity: weightKg,
      preferredServices: [],
    });
  }

  @Get('insurance')
  @ApiOperation({ summary: 'Find insurance partners for corridor' })
  @Roles('owner', 'admin', 'operator')
  async findInsurance(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    return this.insuranceService.findPartnersForCorridor(origin, destination);
  }

  @Get('insurance/estimate')
  @ApiOperation({ summary: 'Get insurance premium estimate' })
  @Roles('owner', 'admin', 'operator')
  async getInsuranceEstimate(
    @Query('partnerId') partnerId: string,
    @Query('cargoValue') cargoValue: number,
  ) {
    const partners = await this.insuranceService.findPartnersForCorridor('', '');
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return null;
    return this.insuranceService.estimatePremium(partner, {
      dealId: '',
      orgId: '',
      origin: '',
      destination: '',
      productType: '',
      insuredValue: cargoValue,
      coverageTypes: [],
    });
  }
}
