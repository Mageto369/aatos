import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';

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
 * Rate limit counters, in Redis when REDIS_URL is set.
 *
 * The previous implementation was a plain object on the instance, which meant
 * the counters lived and died with the process. Verified against a running
 * server: exhausting the five-per-fifteen-minutes registration limit and then
 * restarting the API allowed an immediate sixth attempt. Any deploy reset the
 * brute-force protection on login, and with more than one instance each had
 * its own counters, multiplying the effective limit by the instance count.
 *
 * Redis was already a dependency and already in docker-compose; the only
 * occurrence of REDIS_URL in the source was its config schema.
 *
 * Counting uses INCR plus a PEXPIRE applied only on the first increment, so
 * the window starts at the first request and is not extended by later ones —
 * a sliding expiry would let a steady stream of requests hold the key open
 * indefinitely.
 *
 * When REDIS_URL is absent the in-memory map is used, which keeps local
 * development and the test suite working. That fallback is a development
 * convenience: a warning is logged, and production must set REDIS_URL.
 */
@Injectable()
export class RateLimitStore implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitStore.name);
  private readonly store: RateLimitEntry = {};
  private readonly redis: Redis | null;

  constructor() {
    const url = process.env.REDIS_URL;

    // Tests deliberately stay on the in-memory counter. The suites run in
    // parallel jest workers and register several tenants each from one IP; a
    // shared Redis counter is correctly global and so exhausts the strict
    // 5-per-15-minutes limit across suites, which would make the limiter fight
    // the test run rather than be exercised by it. The Redis path has its own
    // unit test instead. Note REDIS_URL is effectively always present because
    // the Joi schema in app.module.ts gives it a default, which ConfigModule
    // writes back into process.env — so an env check alone cannot detect that
    // Redis was never deliberately configured.
    if (!url || process.env.NODE_ENV === 'test') {
      this.redis = null;
      if (process.env.NODE_ENV !== 'test') {
        this.logger.warn(
          'REDIS_URL is not set — rate limit counters are per-process and reset on restart. ' +
            'Set REDIS_URL in production.',
        );
      }
      return;
    }

    this.redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      enableOfflineQueue: false,
    });
    // A limiter that throws when Redis blips would take the API down with it.
    // Failures are logged and fall through to the in-memory counter instead.
    this.redis.on('error', (err) => this.logger.error(`Redis unavailable: ${err.message}`));
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.pexpire(key, windowMs);
        }
        const ttl = await this.redis.pttl(key);
        return { count, resetAt: Date.now() + (ttl > 0 ? ttl : windowMs) };
      } catch (err) {
        this.logger.error(
          `Redis increment failed, falling back to in-memory: ${(err as Error).message}`,
        );
      }
    }
    return this.incrementInMemory(key, windowMs);
  }

  private incrementInMemory(key: string, windowMs: number): { count: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store[key];

    if (!entry || now > entry.resetAt) {
      this.store[key] = { count: 1, resetAt: now + windowMs };
      return { ...this.store[key] };
    }

    entry.count++;
    // Return a copy: handing back the stored object let a caller observe it
    // mutate under them on a later increment.
    return { ...entry };
  }

  async reset(key: string): Promise<void> {
    delete this.store[key];
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.del(key);
      } catch (err) {
        this.logger.error(`Redis reset failed: ${(err as Error).message}`);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => this.redis?.disconnect());
    }
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
