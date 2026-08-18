import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

/**
 * RLS Context Interceptor
 * 
 * Sets PostgreSQL session variable 'app.current_org_id' from the request's
 * authenticated user before each request. This enables Row Level Security
 * policies at the database layer.
 * 
 * Must be applied globally AFTER the auth middleware/guard so that
 * req.user is populated.
 */
@Injectable()
export class RLSContextInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.orgId) {
      // Set the org ID for this query context
      await this.dataSource.query(
        `SET LOCAL app.current_org_id = $1`,
        [user.orgId],
      );
    } else if (user?.role === 'platform_admin' || user?.isPlatformAdmin) {
      // Platform admin bypasses RLS
      await this.dataSource.query(
        `SET LOCAL app.current_org_id = 'platform_admin'`,
      );
    }

    return next.handle();
  }
}
