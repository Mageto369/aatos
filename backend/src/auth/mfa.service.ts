import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * MFA Service
 * Handles TOTP-based multi-factor authentication.
 * Uses speakeasy or similar library in production.
 * For now, provides the interface and simulation mode.
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly issuer: string;

  constructor(private readonly config: ConfigService) {
    this.issuer = this.config.get('MFA_ISSUER', 'AATOS');

    if (this.config.get('NODE_ENV') === 'production') {
      throw new Error('MFA is simulated. Install otplib and wire real TOTP before production.');
    }
  }

  /**
   * Generate a new TOTP secret for a user
   */
  async generateSecret(userId: string, email: string): Promise<{ secret: string; qrCodeUrl: string }> {
    // In production, use speakeasy.generateSecret()
    // For now, return a simulated secret
    const secret = this.simulateSecret();
    const qrCodeUrl = `otpauth://totp/${this.issuer}:${email}?secret=${secret}&issuer=${this.issuer}`;

    this.logger.log(`Generated MFA secret for user ${userId}`);
    return { secret, qrCodeUrl };
  }

  /**
   * Verify a TOTP token against a secret
   */
  async verifyToken(token: string, _secret: string): Promise<boolean> {
    // In production, use speakeasy.totp.verify()
    // For now, accept any 6-digit code in dev mode
    if (this.config.get('NODE_ENV') === 'development' && token === '000000') {
      return true;
    }

    // Simulated verification — always true for '123456' in test
    if (token === '123456') {
      return true;
    }

    // Real verification would happen here
    return false;
  }

  /**
   * Check if MFA is required for a user role
   */
  isMfaRequired(role: string): boolean {
    const privilegedRoles = ['owner', 'admin', 'compliance_officer', 'finance_officer'];
    return privilegedRoles.includes(role);
  }

  /**
   * Validate backup codes
   */
  async validateBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
    // In production, compare bcrypt hashes
    return hashedCodes.includes(code);
  }

  private simulateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
}
