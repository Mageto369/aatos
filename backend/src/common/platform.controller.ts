import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrencyConversionService } from './currency-conversion.service';
import { FeatureFlagService } from './feature-flag.service';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Platform')
@Controller('platform')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlatformController {
  constructor(
    private readonly currencyService: CurrencyConversionService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly monitoringService: MonitoringService,
  ) {}

  // Currency Conversion
  @Get('currencies')
  @ApiOperation({ summary: 'Get supported currencies' })
  async getCurrencies() {
    return this.currencyService.getSupportedCurrencies();
  }

  @Get('currencies/rates')
  @ApiOperation({ summary: 'Get all FX rates' })
  async getRates() {
    return this.currencyService.getAllRates();
  }

  @Post('currencies/convert')
  @ApiOperation({ summary: 'Convert currency' })
  async convert(@Body() data: { amount: number; from: string; to: string; applyMarkup?: boolean }) {
    return this.currencyService.convert(data.amount, data.from, data.to, data.applyMarkup);
  }

  // Feature Flags
  @Get('flags')
  @ApiOperation({ summary: 'Get all feature flags' })
  async getFlags() {
    return this.featureFlagService.getAllFlags();
  }

  @Get('flags/:key')
  @ApiOperation({ summary: 'Get feature flag' })
  async getFlag(@Param('key') key: string) {
    return this.featureFlagService.getFlag(key);
  }

  // Health / Monitoring
  @Get('health')
  @ApiOperation({ summary: 'Get system health' })
  async getHealth() {
    return this.monitoringService.getOverallHealth();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get active alerts' })
  async getAlerts() {
    return this.monitoringService.getActiveAlerts();
  }
}
