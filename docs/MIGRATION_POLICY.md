# Database Migration Policy
**Version:** 1.0
**Effective:** 2026-08-04
**Authority:** AATOS Autonomous Execution Master Directive

---

## Principle

Never use schema synchronization as the production migration strategy.

`synchronize: true` is **prohibited** in all environments.

---

## Migration Requirements

Every migration must include:

| Element | Required |
|---|---|
| Description | Yes |
| Up migration | Yes |
| Down (rollback) migration | Yes |
| Data impact assessment | Yes |
| Locking impact assessment | Yes |
| Estimated duration | Yes |
| Index definitions | Yes |
| Constraint definitions | Yes |
| Foreign key definitions | Yes |
| Default values | Yes |
| Nullability decisions | Yes |
| Deployment order | Yes |
| Validation queries | Yes |

---

## Migration Testing

Every migration must be tested against:

1. Empty database
2. Representative development data
3. Rollback scenario

---

## Production Deployment

Do not apply migrations to production without:

1. Database backup
2. Peer review
3. Staging validation
4. Documented rollback plan
5. Maintenance window (if locking risk)

---

## Current State

| Property | Value |
|---|---|
| Migration framework | TypeORM |
| Migration directory | `backend/src/database/migrations/` |
| Current migrations | None |
| Baseline schema | `schema/01_core_schema.sql` |

---

## Creating Migrations

```bash
cd backend
npm run migration:generate -- -n MigrationName
```

## Running Migrations

```bash
cd backend
npm run migration:run
```

## Reverting Migrations

```bash
cd backend
npm run migration:revert
```

---

## Enforcement

The `synchronize` setting in `database.module.ts` is permanently set to `false`.
Any change to this setting requires CTO approval and must be recorded in the decision register.
