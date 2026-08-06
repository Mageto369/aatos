import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { CurrentUser, UserPayload } from './decorators/current-user.decorator';

/**
 * Token Refresh Endpoint
 * 
 * Accepts a valid (non-expired) refresh token and issues a new access token.
 * For pilot: re-uses the JWT token with extended expiry as refresh token.
 * Production: should use opaque refresh tokens stored in database.
 */
@ApiTags('Auth')
@Controller('auth')
export class RefreshController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @UseGuards(AuthGuard('jwt'))
  async refresh(@Body('refreshToken') refreshToken: string, @CurrentUser() user: UserPayload) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    // Verify the refresh token is valid
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
        issuer: 'aatos-api',
        audience: 'aatos-client',
      });

      // Ensure the refresh token belongs to the current user
      if (payload.sub !== user.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Issue new access token
      const accessToken = this.jwtService.sign(
        {
          sub: user.userId,
          email: user.email,
          orgId: user.orgId,
          role: user.role,
        },
        {
          expiresIn: '1h',
          issuer: 'aatos-api',
          audience: 'aatos-client',
        },
      );

      // Issue new refresh token
      const newRefreshToken = this.jwtService.sign(
        {
          sub: user.userId,
          type: 'refresh',
        },
        {
          expiresIn: '7d',
          issuer: 'aatos-api',
          audience: 'aatos-client',
        },
      );

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: 3600,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
