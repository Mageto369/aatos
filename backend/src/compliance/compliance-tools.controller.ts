import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomsTariffService } from './customs-tariff.service';
import { ComplianceRuleUpdaterService } from './compliance-rule-updater.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Compliance Tools')
@Controller('compliance-tools')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplianceToolsController {
  constructor(
    private readonly customsTariffService: CustomsTariffService,
    private readonly ruleUpdaterService: ComplianceRuleUpdaterService,
  ) {}

  // HS Code Lookup
  @Get('hs-codes')
  @ApiOperation({ summary: 'Search HS codes' })
  async searchHsCodes(@Query('q') query: string) {
    return this.customsTariffService.lookupHsCode(query || '');
  }

  @Get('hs-codes/:code')
  @ApiOperation({ summary: 'Get HS code details' })
  async getHsCode(@Param('code') code: string) {
    return this.customsTariffService.getHsCode(code);
  }

  @Post('landed-cost')
  @ApiOperation({ summary: 'Calculate landed cost' })
  async calculateLandedCost(@Body() data: {
    hsCode: string;
    productValue: number;
    freightCost: number;
    insuranceCost: number;
    destinationCountry: string;
    originCountry: string;
  }) {
    return this.customsTariffService.calculateLandedCost(data);
  }

  // Compliance Rule Updates
  @Get('rule-updates')
  @ApiOperation({ summary: 'Get pending compliance rule updates' })
  async getPendingUpdates() {
    return this.ruleUpdaterService.getPendingUpdates();
  }

  @Post('rule-updates/check')
  @ApiOperation({ summary: 'Check all compliance sources for updates' })
  async checkSources() {
    return this.ruleUpdaterService.checkAllSources();
  }
}
