# AATOS — Pilot Readiness Status

**Repository:** https://github.com/Mageto369/aatos  
**Branch:** `main`  
**Last Updated:** 2026-08-19

---

## Current Phase: 4A — Live Pilot and Revenue Validation

**Goal:** Prove AATOS produces successful trade, not more software.

**Pilot Constraints (Deliberately Scoped):**
- Corridor: Kenya to U.S. only
- Commodity: Green coffee only
- Organizations: 20 maximum
- Payments: Sandbox only
- Compliance: Manual oversight

---

## Backend (NestJS) — Status

### Production-Ready
| Module | Status | Notes |
|---|---|---|
| Auth | Ready | JWT with orgId, bcrypt, login lockout, MFA (simulated) |
| Organizations | Ready | CRUD, members, verification levels, cursor pagination |
| Products | Ready | CRUD, categories, JSONB attributes, soft deletes |
| RFQs | Ready | Create, publish, quotes, org-scoped queries |
| Deals | Ready | Deal rooms, milestones, org auth, milestone pipeline |
| Messages | Ready | REST + Socket.IO gateway for real-time deal rooms |
| Documents | Ready | CRUD, S3-ready, versioning |
| Notifications | Ready | In-app, unread tracking |
| Inspections | Ready | Booking, scheduling, status tracking |
| Upload | Ready | S3 presigned URL generation |
| Compliance | Ready | Rules engine, checklist generation |
| Analytics | Ready | Transaction metrics, user activity |
| Email | Ready | SendGrid integration (simulated in dev) |

### Database
- **TypeORM** with PostgreSQL 15
- **Partitioned tables:** `audit_logs`, `messages` (monthly partitions through Aug 2027)
- **Automated maintenance:** Monthly cron job creates future partitions
- **Schema drift detector:** Runs in CI to catch entity/migration mismatches
- **Migration verification:** CI runs all migrations on clean database

### API
- Base path: `/api/v1`
- CORS configured for production domains
- Rate limiting enabled
- Helmet security headers
- Compression enabled

---

## Frontend (React + Vite) — Status

### Production-Ready
| Feature | Status |
|---|---|
| Auth (login/register) | Ready |
| Protected routes | Ready |
| Dashboard | Ready |
| RFQ list/create | Ready |
| Deal rooms (real-time) | Ready |
| Document upload | Ready |
| Compliance dashboard | Ready |
| Products | Ready |
| Organization profile | Ready |
| Payments (UI only) | Ready |
| Settings | Ready |
| Admin | Ready |

### Build
- CSS budget: 23.8 KB (checked in CI)
- JS bundle: 432 KB gzipped
- Error boundary: Implemented
- 404 page: Implemented
- Loading/error/empty states: All list pages

---

## CI/CD Pipeline

### GitHub Actions
- **Backend:** Lint → Build → Schema drift check → Migration test → Unit tests
- **Frontend:** Lint → Build → CSS budget check
- **Triggers:** Push/PR to `main`

### Safety Gates
- TypeScript compilation must pass
- Lint must pass
- Migrations must run clean on empty database
- Schema must not drift from entities
- CSS must meet minimum budget

---

## Simulation Stubs (Throw in Production)

These features are simulated in development but **will throw errors** if started in production without configuration:

| Service | Dev Behavior | Production Requirement |
|---|---|---|
| Payments (Flutterwave) | Simulated | `FLUTTERWAVE_SECRET_KEY` |
| Email (SendGrid) | Logged only | `SENDGRID_API_KEY` |
| File Upload (S3) | Mock URLs | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` |
| MFA (TOTP) | Accepts `000000` | Install `otplib` and wire real TOTP |
| Sanctions Screening | 11-entry hardcoded list | Connect OFAC/UN/EU lists |
| Government Trade | In-memory Maps | Implement real API connections |

---

## Environment Variables Required

### Backend
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://...

# Optional but recommended
FLUTTERWAVE_SECRET_KEY=...
SENDGRID_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=...
```

### Frontend
```bash
VITE_API_URL=https://api.aatos.trade/api/v1
VITE_WS_URL=wss://api.aatos.trade
```

---

## Deployment Checklist

- [x] TypeScript compilation clean
- [x] CI pipeline passes
- [x] Database migrations verified
- [x] Simulation stubs gated
- [ ] Backend deployed to persistent host
- [ ] Frontend deployed to CDN
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Environment variables injected
- [ ] Database backups configured
- [ ] Monitoring/alerting configured
- [ ] Vercel SSO disabled (if needed)

---

## Known Issues / Next Work

1. **Backend hosting** — No persistent deployment target configured
2. **Real payments** — Flutterwave sandbox only; production keys needed
3. **Email** — SendGrid integration ready but not sending real emails
4. **Mobile app** — Archived; out of pilot scope
5. **AI matching** — After 100 transactions, teach what matching means
6. **Additional corridors** — After Kenya-U.S. proven

---

## Exit Gate for Phase 4A

- At least one real commercial transaction completed
- At least three accepted deals
- At least ten qualified RFQs
- No critical authorization or compliance incident
- No unresolved payment reconciliation issue
- Full transaction audit trail
- Measured off-platform leakage
- Buyer and supplier feedback collected
