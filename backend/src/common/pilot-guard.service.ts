import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Pilot Enforcement Service
 * Enforces AATOS pilot constraints:
 * - Corridor: Kenya (KE) → United States (US) only
 * - Commodity: Green specialty coffee only
 * - Organization cap: 20 max
 * - Sandbox payments only
 * - 90-day duration
 */
@Injectable()
export class PilotGuardService {
  private readonly logger = new Logger(PilotGuardService.name);
  private readonly enabled: boolean;
  private readonly maxOrgs: number;
  private readonly allowedOrigin = 'KE';
  private readonly allowedDestination = 'US';

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('PILOT_MODE') === 'true';
    this.maxOrgs = parseInt(this.configService.get<string>('PILOT_MAX_ORGS') || '20', 10);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  assertEnabled(): void {
    if (!this.enabled) return;
    this.logger.debug('Pilot mode active — enforcing constraints');
  }

  validateCorridor(origin: string, destination: string): void {
    if (!this.enabled) return;
    if (origin !== this.allowedOrigin || destination !== this.allowedDestination) {
      this.logger.warn(`Blocked corridor: ${origin} → ${destination}`);
      throw new ForbiddenException(
        `Pilot only supports ${this.allowedOrigin} → ${this.allowedDestination} corridor`,
      );
    }
  }

  validateCommodity(categoryId: string): void {
    if (!this.enabled) return;
    // Green coffee category ID from seed data
    const allowedCategory = this.configService.get<string>('PILOT_COMMODITY_CATEGORY') || 'cat-coffee-green';
    if (categoryId !== allowedCategory) {
      this.logger.warn(`Blocked commodity: ${categoryId}`);
      throw new ForbiddenException('Pilot only supports green specialty coffee');
    }
  }

  async validateOrgCap(currentCount: number): Promise<void> {
    if (!this.enabled) return;
    if (currentCount >= this.maxOrgs) {
      this.logger.warn(`Organization cap reached: ${currentCount}/${this.maxOrgs}`);
      throw new ForbiddenException(`Pilot limited to ${this.maxOrgs} organizations`);
    }
  }

  validateSandboxOnly(paymentProvider: string): void {
    if (!this.enabled) return;
    const allowedProviders = ['sandbox', 'test', 'mock'];
    if (!allowedProviders.includes(paymentProvider.toLowerCase())) {
      this.logger.warn(`Blocked production payment: ${paymentProvider}`);
      throw new ForbiddenException('Pilot requires sandbox payment providers only');
    }
  }
}
