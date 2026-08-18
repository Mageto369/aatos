import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or an entire controller) as reachable without a JWT.
 *
 * JwtAuthGuard is registered globally via APP_GUARD, so every route requires
 * a valid access token unless it opts out with this decorator. Use it only
 * for endpoints that cannot present an access token by definition:
 * registration and login (no token yet), refresh and logout (the opaque
 * refresh token is the credential), liveness/readiness probes, and provider
 * webhooks (authenticated by signature instead).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
