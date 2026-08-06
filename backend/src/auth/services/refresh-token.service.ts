import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { randomBytes } from 'crypto';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
  ) {}

  /**
   * Create a new opaque refresh token for a user.
   * Returns the plain token (store securely by client).
   */
  async createToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const plainToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const tokenEntity = this.tokenRepo.create({
      userId,
      token: plainToken,
      ipAddress,
      userAgent,
      expiresAt,
      revokedAt: null,
    });

    await this.tokenRepo.save(tokenEntity);

    return { token: plainToken, expiresAt };
  }

  /**
   * Validate a refresh token and return the associated userId.
   * Implements token rotation: existing token is revoked.
   */
  async validateAndRotate(
    plainToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ userId: string; newToken: string; newExpiresAt: Date }> {
    const tokenEntity = await this.tokenRepo.findOne({
      where: { token: plainToken },
    });

    if (!tokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenEntity.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Rotate: revoke old token
    tokenEntity.revokedAt = new Date();
    await this.tokenRepo.save(tokenEntity);

    // Create new token
    const { token: newToken, expiresAt: newExpiresAt } = await this.createToken(
      tokenEntity.userId,
      ipAddress,
      userAgent,
    );

    return { userId: tokenEntity.userId, newToken, newExpiresAt };
  }

  /**
   * Revoke a specific refresh token.
   */
  async revokeToken(plainToken: string): Promise<void> {
    const tokenEntity = await this.tokenRepo.findOne({
      where: { token: plainToken },
    });

    if (tokenEntity && !tokenEntity.revokedAt) {
      tokenEntity.revokedAt = new Date();
      await this.tokenRepo.save(tokenEntity);
    }
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Clean up expired/revoked tokens older than a cutoff date.
   */
  async cleanupOldTokens(cutoffDate: Date): Promise<number> {
    const result = await this.tokenRepo.delete({
      expiresAt: LessThan(cutoffDate),
    });
    return result.affected ?? 0;
  }
}
