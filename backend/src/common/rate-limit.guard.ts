import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter.
 * In production, replace with Redis-backed implementation (e.g., @nestjs/throttler).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly maxRequests = 100; // per window
  private readonly windowMs = 60_000; // 1 minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const now = Date.now();

    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      throw new HttpException(
        { statusCode: 429, message: 'Too many requests. Please try again later.', retryAfter: Math.ceil((entry.resetAt - now) / 1000) },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;
    return true;
  }

  private getKey(request: any): string {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userId = request.user?.userId || 'anon';
    const path = request.route?.path || request.path || '/';
    return `${ip}:${userId}:${path}`;
  }
}
