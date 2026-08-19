import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

/**
 * Publishes the caller's organization as the Postgres session variable
 * `app.current_org_id`, which the RLS policies in AddRLSPolicies read.
 *
 * Two things about the current state, both deliberate:
 *
 * 1. `SET LOCAL app.current_org_id = $1` is not valid — Postgres SET takes no
 *    parameter placeholders, so every authenticated request raised
 *    `syntax error at or near "$1"` and returned 500. set_config() is the
 *    parameterised form.
 *
 * 2. The third argument to set_config is `is_local`. It is true here, so the
 *    setting lives only for the surrounding transaction. dataSource.query()
 *    borrows an arbitrary connection from the pool and returns it, so outside
 *    an explicit transaction this call is a deliberate no-op rather than
 *    something that persists. That is the safe behaviour: a session-scoped
 *    (is_local = false) setting on a pooled connection would outlive the
 *    request and be read by whichever tenant's request borrowed that
 *    connection next — a cross-tenant leak worse than the gap it closes.
 *
 * Consequently the RLS policies do not yet constrain anything, and neither
 * does this interceptor. Making them enforce needs three things that belong to
 * database provisioning rather than to application code:
 *
 *   - the application must connect as a role that neither owns the tables nor
 *     holds BYPASSRLS (today it is the owner, and rolbypassrls is true, so
 *     Postgres skips every policy), or the tables need FORCE ROW LEVEL
 *     SECURITY;
 *   - the org context must be set on the same connection that runs the query,
 *     which means a request-scoped transaction or query runner;
 *   - the policies then need a test that fails when they are removed.
 *
 * Until then, tenant isolation is enforced in the service layer and covered by
 * tenant-isolation.e2e-spec.ts. This interceptor is kept wired so the context
 * is already flowing when the above lands.
 */
@Injectable()
export class RLSContextInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const orgContext =
      user?.role === 'platform_admin' || user?.isPlatformAdmin
        ? 'platform_admin'
        : (user?.orgId ?? null);

    if (orgContext) {
      try {
        await this.dataSource.query(`SELECT set_config('app.current_org_id', $1, true)`, [
          orgContext,
        ]);
      } catch {
        // Never fail a request because the RLS context could not be published.
        // The policies are not enforcing yet, so a failure here is not a
        // security decision; letting it through as a 500 was.
      }
    }

    return next.handle();
  }
}
