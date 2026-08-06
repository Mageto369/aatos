# AATOS Database Migration Status

**Date:** 2026-08-06  
**Status:** Production-ready migration chain established

---

## Migration Chain

| # | File | Timestamp | Description | Status |
|---|------|-----------|-------------|--------|
| 1 | `1722720000000-InitialSchema.ts` | 2024-08-04 | Full initial schema with enums, tables, indexes, partitions | DEPLOYED |
| 2 | `1722800000000-Phase3SchemaUpdate.ts` | 2026-08-06 | Phase 3/4 entities, schema cleanup | READY |

---

## Initial Schema (1722720000000)

### Tables Created
- `users` — Platform users with roles
- `organizations` — Companies/cooperatives with verification levels
- `organization_members` — User-org membership links
- `documents` — Uploaded documents with verification status
- `product_categories` — Commodity categories
- `product_category_attributes` — Category-specific fields (OBSOLETE — removed in Phase 3)
- `products` — Listed products/offers
- `compliance_rules` — Regulatory requirements by corridor
- `compliance_checklists` — Per-entity compliance task lists
- `compliance_checklist_items` — Individual compliance tasks
- `rfqs` — Buyer requests for quotation
- `quotations` — Seller responses to RFQs
- `deals` — Active trade transactions
- `deal_milestones` — Payment/delivery milestones
- `messages` — Platform messaging (partitioned)
- `inspections` — Quality inspections
- `payments` — Payment records
- `service_provider_profiles` — Logistics/insurance partner profiles (OBSOLETE — removed in Phase 3)
- `audit_logs` — Audit trail (partitioned)
- `notifications` — User notifications

### PostgreSQL Extensions
- `uuid-ossp` — UUID generation
- `pg_trgm` — Trigram text search
- `btree_gin` — GIN index support
- `citext` — Case-insensitive text

### Enums Created
- `org_type`, `org_status`, `verification_level`
- `user_role`, `user_status`
- `document_type`, `document_status`
- `product_status`, `product_category_group`
- `rfq_status`, `quotation_status`, `deal_status`
- `milestone_type`, `inspection_status`, `payment_status`
- `compliance_requirement_type`

---

## Phase 3 Schema Update (1722800000000)

### Changes

#### Added Tables
| Table | Entity | Purpose |
|-------|--------|---------|
| `carbon_footprints` | `CarbonFootprintEntity` | ESG: shipment carbon calculations |
| `disputes` | `DisputeEntity` | Deal dispute resolution |
| `feature_flags` | `FeatureFlagEntity` | Safe feature rollouts |
| `subscriptions` | `SubscriptionEntity` | SaaS billing tiers |
| `webhooks` | `WebhookEntity` | External system integrations |

#### Removed Tables
| Table | Reason |
|-------|--------|
| `service_provider_profiles` | Replaced by external partner API integrations |
| `product_category_attributes` | Merged into `product_categories` as JSONB |

#### Modified Tables
| Table | Change | Reason |
|-------|--------|--------|
| `compliance_rules` | Dropped `issuing_authority_country`, `required_document_type`, `reviewed_by`, `tags` | Entity simplified to match actual usage |

---

## Deployment Instructions

### Fresh Installation
```bash
cd backend
npm run migration:run
npx ts-node src/compliance/seeds/seed-compliance-rules.ts
```

### Existing Database (Already Has Initial Schema)
```bash
cd backend
npm run migration:run
# This applies only the Phase 3 update
```

### Verify Migration Applied
```bash
psql $DATABASE_URL -c "SELECT name FROM migrations ORDER BY timestamp;"
```

### Rollback (Emergency Only)
```bash
cd backend
npm run migration:revert
# Reverts ONLY the last applied migration
```

---

## Critical Rules

1. **Never use `synchronize: true` in production.** The `DatabaseModule` enforces this — it throws on startup if synchronize is enabled with `NODE_ENV=production`.

2. **Always generate migrations for schema changes.** Do not modify existing migrations after they have been deployed.

3. **Test migrations on a copy of production data** before deploying to production.

4. **Back up before running migrations.** The Phase 3 update drops two tables (`service_provider_profiles`, `product_category_attributes`). If these contain data, back up first.

---

## Environment Configuration

| Variable | Development | Production |
|----------|-------------|------------|
| `DATABASE_URL` | Required | Required |
| `DATABASE_SYNCHRONIZE` | `true` (optional) | Must be `false` or unset |
| `NODE_ENV` | `development` | `production` |

The `DatabaseModule` will:
- Auto-run migrations on production startup (`migrationsRun: true`)
- Reject synchronize in production (throws fatal error)

---

## Next Migration (When Needed)

To generate a new migration after entity changes:

```bash
cd backend
# Ensure data-source.ts points to your DB
npx typeorm-ts-node-commonjs migration:generate -d ./src/database/data-source.ts src/database/migrations/DescriptiveName
```

Commit the generated migration file. Never edit migration timestamps.

---

## Audit

| Check | Status |
|-------|--------|
| Initial migration exists | ✅ |
| Phase 3 migration created | ✅ |
| `synchronize: true` removed from data-source | ✅ |
| Production safeguard in DatabaseModule | ✅ |
| Migration rollback defined (down method) | ✅ |
| Seed script for compliance rules | ✅ |
| Migration status documented | ✅ |

---

*Document version: 1.0*  
*Last updated: 2026-08-06*
