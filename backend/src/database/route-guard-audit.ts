/**
 * Route guard audit.
 *
 * JwtAuthGuard is registered globally (APP_GUARD), so every route is
 * authenticated unless it opts out with @Public(). That default is only
 * trustworthy if the set of opt-outs stays small and deliberate — the guard
 * shipped once with no opt-out mechanism at all, which locked every route
 * including login, and the opposite mistake (an unnoticed @Public on a
 * controller class, which covers all of its routes) is just as easy to make
 * and far quieter.
 *
 * This walks the controller sources and reports, for every route: its method
 * and path, whether it is public, and which roles it requires. It exits 1 if
 * a route is public without being on the expected list below, so adding one
 * is a deliberate act that has to be recorded here.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/route-guard-audit.ts
 *   npx ts-node ... src/database/route-guard-audit.ts --print   (full matrix)
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Routes that must remain reachable without an access token, with the reason.
 * Anything public and absent from this list fails the audit.
 */
const EXPECTED_PUBLIC: Record<string, string> = {
  'POST /auth/register': 'no token exists yet',
  'POST /auth/login': 'no token exists yet',
  'POST /auth/refresh': 'the opaque refresh token is the credential',
  'POST /auth/logout': 'revokes a refresh token, access token may be expired',
  'GET /health': 'liveness probe, must answer before auth is available',
  'GET /health/ready': 'readiness probe',
  'GET /health/live': 'liveness probe',
  'POST /webhooks/flutterwave': 'provider callback, authenticated by signature',
};

/**
 * Routes that legitimately need no caller identity, with the reason. Mostly
 * marketplace reads that are the same for every tenant by design.
 */
const EXPECTED_BLIND: Record<string, string> = {
  // Marketplace reads: the same for every tenant by design. A buyer must be
  // able to look up a supplier and a product listing, which is the point.
  'GET /products/:id': 'public product listing, identical for every caller',
  'GET /organizations/:id': 'public organization profile in the marketplace directory',
  'GET /organizations/slug/:slug': 'public organization profile by slug',
  'GET /compliance-tools/hs-codes/:code': 'reference data, not tenant-specific',
  'GET /platform/flags/:key': 'feature flag value, not tenant-specific',

  // Known debt, deliberately listed rather than silently allowed. Each takes an
  // id from the path and cannot scope to the caller. They are lower severity
  // than the three fixed alongside this list — mostly reads of data a
  // counterparty already sees, or enterprise routes for features the pilot does
  // not use — but each is a real gap and should be closed before those features
  // carry live data.
  'GET /analytics/organization/:orgId': 'UNSCOPED — reads another org analytics',
  'GET /enterprise/esg/report/:orgId': 'UNSCOPED — enterprise feature, unused in pilot',
  'GET /enterprise/esg/score/:orgId': 'UNSCOPED — enterprise feature, unused in pilot',
  'GET /enterprise/matches/buyer/:orgId': 'UNSCOPED — enterprise feature, unused in pilot',
  'GET /enterprise/subscriptions/:orgId': 'UNSCOPED — enterprise feature, unused in pilot',
  'GET /enterprise/white-label/:orgId': 'UNSCOPED — enterprise feature, unused in pilot',
  'GET /organizations/:id/members': 'UNSCOPED — member list of any organization',
  'PUT /inventory/items/:id/quantity': 'UNSCOPED — writes another org inventory',
  'PUT /inventory/items/:id/status': 'UNSCOPED — writes another org inventory',
  'GET /inventory/products/:productId': 'UNSCOPED — reads another org inventory',
  'GET /inventory/warehouses/:id/items': 'UNSCOPED — reads another org inventory',
  'GET /inventory/warehouses/:id': 'UNSCOPED — reads another org warehouse',
  // Manual override tooling, restricted to platform_admin. They act on an id
  // from the path by design; the control is the role, not the tenant.
  'POST /workflows/inspection/:id/result': 'platform_admin only — manual override',
  'POST /workflows/milestone/:id/complete': 'platform_admin only — manual override',
  'POST /workflows/rfq/:id/publish': 'platform_admin only — manual override',
};

interface Route {
  method: string;
  path: string;
  handler: string;
  file: string;
  isPublic: boolean;
  roles: string[];
  /** Whether the handler receives the request, and so can know who is calling. */
  seesCaller: boolean;
}

function controllerFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      out.push(...controllerFiles(full));
    } else if (entry.endsWith('.controller.ts')) {
      out.push(full);
    }
  }
  return out;
}

function join(base: string, sub: string): string {
  const b = base.replace(/^\/|\/$/g, '');
  const s = sub.replace(/^\/|\/$/g, '');
  return '/' + [b, s].filter(Boolean).join('/');
}

function parse(file: string): Route[] {
  const src = fs.readFileSync(file, 'utf-8');

  const ctrl = src.match(/@Controller\(\s*['"]?([^'")]*)['"]?\s*\)/);
  if (!ctrl) return [];
  const base = ctrl[1] || '';

  // A @Public() above @Controller applies to every route in the class.
  const classPublic = /@Public\(\)\s*(?:\r?\n\s*)*@Controller\(/.test(src);

  const routes: Route[] = [];
  const lines = src.split('\n');

  // Anchor on the handler signature and walk back over its contiguous
  // decorator lines. Decorator order is arbitrary in TypeScript — @Public()
  // may sit above or below @Get() — so scanning only after the verb misses
  // half the ways a route can be opened up.
  const signature = /^\s{2}(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const sig = lines[i].match(signature);
    if (!sig) continue;

    // The handler's parameter list, which may wrap over several lines. A
    // handler that never receives the request cannot scope anything to the
    // caller — that is the signature shared by twelve cross-tenant holes found
    // in this codebase, several of them literally an unused orgId beside a
    // where clause that ignored it.
    let params = '';
    let depth = 0;
    for (let k = i; k < lines.length && k < i + 25; k++) {
      for (const ch of lines[k]) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (depth > 0) params += ch;
      }
      if (depth <= 0 && k > i - 1 && params.length) break;
    }

    // Walk back over the handler's own decorators and stop. The first version
    // of this loop also consumed any line starting with a closing bracket,
    // which meant it walked straight through the previous handler's closing
    // brace and swallowed that handler's decorators too. The route then took
    // the *earlier* @Get()'s path: GET /payments/deal/:dealId was recorded as
    // a second GET /payments and so escaped the blind check entirely. A
    // decorator that leaked the same way would have been @Public().
    //
    // Read bottom-up, tracking bracket depth. At depth 0 only a line opening a
    // decorator belongs to the block: one starting with '@', or with ')',
    // which closes a decorator wrapped over several lines. A line starting
    // with '}' closes a function body, never a decorator, and ends the walk.
    const block: string[] = [];
    let bracket = 0;
    for (let j = i - 1; j >= 0; j--) {
      const line = lines[j].trim();
      if (line === '' || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
        continue;
      }
      if (bracket === 0 && !line.startsWith('@') && !line.startsWith(')')) break;
      block.unshift(lines[j]);
      for (const ch of line) {
        if (ch === '(' || ch === '[' || ch === '{') bracket--;
        else if (ch === ')' || ch === ']' || ch === '}') bracket++;
      }
    }
    if (!block.length) continue;

    const text = block.join('\n');
    const verb = text.match(/@(Get|Post|Put|Patch|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/);
    if (!verb) continue;

    const rolesMatch = text.match(/@Roles\(([^)]*)\)/);
    const roles = rolesMatch
      ? Array.from(rolesMatch[1].matchAll(/['"]([^'"]+)['"]/g)).map((r) => r[1])
      : [];

    routes.push({
      method: verb[1].toUpperCase(),
      path: join(base, verb[2] ?? ''),
      handler: sig[1],
      file: file.replace(/^.*\/src\//, 'src/'),
      isPublic: classPublic || /@Public\(\)/.test(text),
      roles,
      seesCaller: /@(Request|Req|CurrentUser)\(/.test(params),
    });
  }
  return routes;
}

function main(): number {
  const routes = controllerFiles(path.join(__dirname, '..'))
    .flatMap(parse)
    .sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method));

  const publicRoutes = routes.filter((r) => r.isPublic);
  const guarded = routes.filter((r) => !r.isPublic);
  const mutating = guarded.filter((r) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method));
  const mutatingNoRoles = mutating.filter((r) => r.roles.length === 0);

  if (process.argv.includes('--print')) {
    const w = Math.max(...routes.map((r) => r.path.length)) + 2;
    console.log(`${'METHOD'.padEnd(7)}${'PATH'.padEnd(w)}ACCESS`);
    for (const r of routes) {
      const access = r.isPublic
        ? 'PUBLIC'
        : r.roles.length
          ? `roles: ${r.roles.join(', ')}`
          : 'authenticated';
      console.log(`${r.method.padEnd(7)}${r.path.padEnd(w)}${access}`);
    }
    console.log();
  }

  const unscopedDebt = Object.entries(EXPECTED_BLIND).filter(([, why]) =>
    why.startsWith('UNSCOPED'),
  );

  console.log(
    `${routes.length} routes — ${publicRoutes.length} public, ${guarded.length} authenticated ` +
      `(${mutating.length - mutatingNoRoles.length} of ${mutating.length} mutating routes carry @Roles).`,
  );
  if (unscopedDebt.length) {
    console.log(
      `${unscopedDebt.length} routes take a path id and cannot scope to the caller — ` +
        'recorded in EXPECTED_BLIND, not yet fixed.',
    );
  }

  const unexpected = publicRoutes.filter((r) => !(`${r.method} ${r.path}` in EXPECTED_PUBLIC));
  const missing = Object.keys(EXPECTED_PUBLIC).filter(
    (k) => !publicRoutes.some((r) => `${r.method} ${r.path}` === k),
  );

  let failed = false;

  if (unexpected.length) {
    failed = true;
    console.error('\nPublic routes not on the expected list:');
    for (const r of unexpected) {
      console.error(`  ${r.method} ${r.path}  (${r.file} → ${r.handler})`);
    }
    console.error(
      '\nEach of these is reachable with no access token. Add it to EXPECTED_PUBLIC\n' +
        'with a reason if that is intended, or remove the @Public() decorator.',
    );
  }

  if (missing.length) {
    failed = true;
    console.error('\nExpected public but no longer are:');
    for (const k of missing) console.error(`  ${k} — ${EXPECTED_PUBLIC[k]}`);
    console.error('\nIf a route moved, update EXPECTED_PUBLIC; users cannot sign in without these.');
  }

  // Handlers that take a resource id from the path but never receive the
  // request. Such a handler cannot scope to the caller — it has no way to know
  // who is asking — so any per-tenant check is structurally impossible. Every
  // cross-tenant hole found in this codebase had exactly this shape.
  const blind = guarded.filter(
    (r) => /:[A-Za-z]/.test(r.path) && !r.seesCaller && !(`${r.method} ${r.path}` in EXPECTED_BLIND),
  );

  if (blind.length) {
    failed = true;
    console.error(`\nHandlers taking a path id but never receiving the request (${blind.length}):`);
    for (const r of blind) {
      console.error(`  ${r.method.padEnd(6)} ${r.path.padEnd(44)} ${r.file} → ${r.handler}`);
    }
    console.error(
      '\nEach cannot scope to the caller: it has no request, so it cannot know who\n' +
        'is asking. Add @Request() and check ownership, or record it in EXPECTED_BLIND\n' +
        'with the reason it is legitimately caller-independent.',
    );
  }

  // Two handlers claiming one method+path. Nest binds the first and the second
  // is dead code, so this is a real defect either way — but it is also how the
  // decorator walk-back bug announced itself: a mis-parsed route took its
  // neighbour's @Get() and showed up as a duplicate of it while its own path
  // vanished from the matrix, taking it out of the blind check unnoticed.
  const seen = new Map<string, Route[]>();
  for (const r of routes) {
    const key = `${r.method} ${r.path}`;
    seen.set(key, [...(seen.get(key) ?? []), r]);
  }
  const collisions = [...seen.entries()].filter(([, rs]) => rs.length > 1);

  if (collisions.length) {
    failed = true;
    console.error(`\nRoutes declared more than once (${collisions.length}):`);
    for (const [key, rs] of collisions) {
      console.error(`  ${key}`);
      for (const r of rs) console.error(`      ${r.file} → ${r.handler}`);
    }
    console.error(
      '\nOnly the first is reachable. Either two handlers really do collide, or\n' +
        'this audit mis-parsed one of them and its true path is not being checked.',
    );
  }

  if (mutatingNoRoles.length) {
    // Reported, not fatal: some mutating routes legitimately need only a valid
    // session. Kept visible so the number is a conscious one.
    console.log('\nAuthenticated mutating routes with no @Roles (review periodically):');
    for (const r of mutatingNoRoles) console.log(`  ${r.method} ${r.path}`);
  }

  return failed ? 1 : 0;
}

process.exit(main());
