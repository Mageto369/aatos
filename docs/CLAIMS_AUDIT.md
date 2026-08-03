# Claims Audit
**Date:** 2026-08-04
**Auditor:** krenovia
**Scope:** Repository-wide claims vs. implementation

---

## Methodology

For each claim found in documentation, README, or code comments, verify against:
1. Working code and runtime behavior
2. Applied database schema
3. Passing tests (if claimed)
4. Configuration files

---

## Findings

### C001: OAuth 2.0 + OIDC Authentication

| Property | Value |
|---|---|
| **Claim** | API uses OAuth 2.0 (Authorization Code + PKCE) |
| **Sources** | `api/API_SPECIFICATION.md`, `docs/ARCHITECTURE.md` |
| **Reality** | JWT with bcrypt password hashing. No OAuth module. No OIDC. |
| **Evidence** | `backend/src/auth/auth.service.ts` — `bcrypt.compare()`, JWT sign. No Passport OAuth strategy. |
| **Risk** | Documentation false. Enterprise buyers may expect OAuth. |
| **Action** | API spec corrected to JWT. ARCHITECTURE.md corrected. |
| **Status** | RESOLVED |

---

### C002: Escrow Payment Holding

| Property | Value |
|---|---|
| **Claim** | Platform supports escrow payments, holds funds until milestone completion |
| **Sources** | `backend/src/payments/payments.service.ts`, `backend/src/deals/entities/deal.entity.ts`, frontend Payments page |
| **Reality** | Database records payment status. No actual fund custody. Flutterwave handles payments. "Escrow" is simulated via status fields. |
| **Evidence** | `payments.service.ts` line 156 comment: "In production: trigger Flutterwave transfer". `flutterwave.service.ts` line 192: "Escrow is simulated via subaccount splits". |
| **Risk** | Legal. Platform claiming to hold funds without license. |
| **Action** | Escrow claims removed. Payment functionality relabeled as "payment milestone tracking". |
| **Status** | RESOLVED |

---

### C003: Test Coverage

| Property | Value |
|---|---|
| **Claim** | "GitHub Actions CI/CD (backend, frontend, DB tests)" — DEV_STATUS claims tests exist |
| **Sources** | `DEV_STATUS.md`, `.github/workflows/ci-cd.yml` |
| **Reality** | Zero `.spec.ts` files in `backend/src/`. CI runs `npm test -- --coverage` but there are no tests to run. |
| **Evidence** | `find backend/src -name "*.spec.ts"` returns 0 files. |
| **Risk** | Quality claim false. No regression protection. |
| **Action** | DEV_STATUS to be corrected. Critical-path tests to be written in Phase 1. |
| **Status** | PARTIAL — Claim documented, tests pending Phase 1 |

---

### C004: TypeORM Auto-Migration Safe

| Property | Value |
|---|---|
| **Claim** | "TypeORM with auto-migration in development" — implied safe |
| **Sources** | `DEV_STATUS.md`, `backend/src/database/database.module.ts` |
| **Reality** | `synchronize: true` when `NODE_ENV === 'development'`. Can drop columns, lose data on entity changes. |
| **Evidence** | `database.module.ts` line 13: `synchronize: config.get('NODE_ENV') === 'development'` |
| **Risk** | Data loss in development. No migration history. Schema drift. |
| **Action** | `synchronize` set to `false` permanently. Migration policy created. |
| **Status** | RESOLVED |

---

### C005: 22+ Tables, 60+ Indexes Stable

| Property | Value |
|---|---|
| **Claim** | Stable database schema with 22+ tables, 60+ indexes |
| **Sources** | `DEV_STATUS.md` |
| **Reality** | Schema defined in SQL files but no migrations. TypeORM `synchronize: true` means schema can change without tracking. |
| **Evidence** | No `migrations/` directory. `synchronize: true` in dev. |
| **Risk** | Schema changes untracked. Production deployment risky. |
| **Action** | Migration policy created. Initial migration to be generated from schema. |
| **Status** | IN PROGRESS |

---

## Summary

| Claim | Status | Risk Level |
|---|---|---|
| OAuth 2.0 + OIDC | RESOLVED | High |
| Escrow holding | RESOLVED | Critical |
| Test coverage | PARTIAL | High |
| Auto-migration safe | RESOLVED | High |
| Schema stability | IN PROGRESS | Medium |

---

*All resolved claims have been corrected in code or documentation. Partial claims have remediation plans in REMEDIATION_PLAN.md.*
