import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { AuditLogger } from './audit-logger.service';
import { RateLimitStore, RateLimitGuard } from './rate-limit.guard';
import { NotificationService } from './notification.service';
import { CurrencyConversionService } from './currency-conversion.service';
import { FeatureFlagService } from './feature-flag.service';
import { MonitoringService } from './monitoring.service';
import { AdvancedSearchService } from './advanced-search.service';
import { EnterprisePricingService } from './enterprise-pricing.service';
import { ESGReportingService } from './esg-reporting.service';
import { WhiteLabelService } from './white-label.service';
import { PartnerApiService } from './partner-api.service';
import { GovernmentTradeService } from './government-trade.service';
import { MatchingEngineService } from './matching-engine.service';
import { SearchController } from './search.controller';
import { PlatformController } from './platform.controller';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    AuditLogger,
    RateLimitStore,
    NotificationService,
    CurrencyConversionService,
    FeatureFlagService,
    MonitoringService,
    AdvancedSearchService,
    EnterprisePricingService,
    ESGReportingService,
    WhiteLabelService,
    PartnerApiService,
    GovernmentTradeService,
    MatchingEngineService,
  ],
  controllers: [SearchController, PlatformController],
  exports: [AuditLogger, RateLimitStore, NotificationService, CurrencyConversionService, FeatureFlagService, MonitoringService, AdvancedSearchService, EnterprisePricingService, ESGReportingService, WhiteLabelService, PartnerApiService, GovernmentTradeService, MatchingEngineService],
})
export class CommonModule {}
