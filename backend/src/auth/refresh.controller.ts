import { Controller, Post, Body, UnauthorizedException, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './services/refresh-token.service';
import { RateLimitGuard, Throttle } from '../common/rate-limit.guard';
import { Public } from './decorators/public.decorator';

/**
 * Token Refresh Endpoint
 * 
 * Accepts a valid refresh token and issues a new access token + new refresh token.
 * Implements refresh token rotation for security.
 */
@ApiTags('Auth')
@Controller('auth')
export class RefreshController {
  constructor(
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  @Post('refresh')
  @Public()
  @Throttle('strict')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Req() req: any,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    try {
      // Validate and rotate: old token revoked, new token issued
      const { userId, newToken, newExpiresAt } = await this.refreshTokenService.validateAndRotate(
        refreshToken,
        req.ip,
        req.headers['user-agent'],
      );

      // Issue new access token
      const accessToken = this.jwtService.sign(
        {
          sub: userId,
        },
        {
          expiresIn: '1h',
          issuer: 'aatos-api',
          audience: 'aatos-client',
        },
      );

      return {
        access_token: accessToken,
        refresh_token: newToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_expires_at: newExpiresAt.toISOString(),
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body('refreshToken') refreshToken: string) {
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }
}
