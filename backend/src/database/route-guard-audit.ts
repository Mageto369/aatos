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

interface Route {
  method: string;
  path: string;
  handler: string;
  file: string;
  isPublic: boolean;
  roles: string[];
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

    const block: string[] = [];
    for (let j = i - 1; j >= 0; j--) {
      const line = lines[j].trim();
      if (line === '' || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
        continue;
      }
      // Decorators may wrap across lines; keep consuming while the line is
      // part of a decorator or its continuation.
      if (line.startsWith('@') || /^[)\]}]/.test(line) || /[,({[]$/.test(line)) {
        block.unshift(lines[j]);
        continue;
      }
      break;
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

  console.log(
    `${routes.length} routes — ${publicRoutes.length} public, ${guarded.length} authenticated ` +
      `(${mutating.length - mutatingNoRoles.length} of ${mutating.length} mutating routes carry @Roles).`,
  );

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

  if (mutatingNoRoles.length) {
    // Reported, not fatal: some mutating routes legitimately need only a valid
    // session. Kept visible so the number is a conscious one.
    console.log('\nAuthenticated mutating routes with no @Roles (review periodically):');
    for (const r of mutatingNoRoles) console.log(`  ${r.method} ${r.path}`);
  }

  return failed ? 1 : 0;
}

process.exit(main());
