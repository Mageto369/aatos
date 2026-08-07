import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

interface RateLimitEntry {
  [key: string]: { count: number; resetAt: number };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Strict: login, password reset
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 5, keyPrefix: 'strict' },
  // Standard: API endpoints
  standard: { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'std' },
  // Generous: public endpoints, search
  generous: { windowMs: 60 * 1000, maxRequests: 120, keyPrefix: 'gen' },
  // Upload: file uploads
  upload: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'upload' },
} as const;

export const THROTTLE_KEY = 'throttle';
export const Throttle = (configKey: keyof typeof RATE_LIMITS) => SetMetadata(THROTTLE_KEY, configKey);

/**
 * In-memory rate limit store.
 * In production, replace with Redis-backed store.
 */
@Injectable()
export class RateLimitStore {
  private store: RateLimitEntry = {};

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const entry = this.store[key];

    if (!entry || now > entry.resetAt) {
      this.store[key] = { count: 1, resetAt: now + windowMs };
      return this.store[key];
    }

    entry.count++;
    return entry;
  }

  async reset(key: string): Promise<void> {
    delete this.store[key];
  }
}

/**
 * Rate Limiting Guard
 * Protects endpoints from abuse.
 * Reads @Throttle() decorator metadata to select config.
 * In production, use a Redis-backed store for distributed rate limiting.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: RateLimitStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const configKey = this.reflector.getAllAndOverride<keyof typeof RATE_LIMITS>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const config = configKey ? RATE_LIMITS[configKey] : RATE_LIMITS.standard;
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.extractKey(request, config);

    const { count, resetAt } = await this.store.increment(key, config.windowMs);

    if (count > config.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private extractKey(request: Request, config: RateLimitConfig): string {
    const prefix = config.keyPrefix || 'rl';
    const identifier = (request as any).user?.id || request.ip || 'anonymous';
    const route = request.route?.path || request.path;
    return `${prefix}:${identifier}:${route}`;
  }
}
