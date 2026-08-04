# AATOS System Architecture Report

**Project:** AATOS (African Agricultural Trade Operating System)
**Branch:** `phase-3/production-scale`
**Report Date:** 2026-08-04
**Status:** Compilation Clean | Build Verified | Pre-Production Review

---

## 1. System Overview

### Scale Metrics
| Metric | Count |
|--------|-------|
| Backend TypeScript Files | 136 |
| Frontend TS/TSX Files | 34 |
| Database Entities | 24 |
| API Controllers | 23 |
| NestJS Modules | 22 |

### Architecture Pattern
- **Backend:** NestJS (modular monolith, ready for microservices decomposition)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL with TypeORM
- **Cache/Sessions:** Redis (optional, falls back to in-memory)
- **Real-time:** Socket.IO (WebSocket)
- **File Storage:** AWS S3 (optional, stubbed if not configured)
- **Payments:** Flutterwave integration (optional, simulated if not configured)
- **Email:** SendGrid (optional, logged to console if not configured)

---

## 2. Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── DatabaseModule
│   └── TypeOrmModule (postgres, autoLoadEntities)
├── CommonModule (global)
│   ├── AuditLogger + AuditLog entity
│   ├── RateLimitGuard + RateLimitStore
│   ├── NotificationService
│   ├── CurrencyConversionService
│   ├── FeatureFlagService
│   ├── MonitoringService
│   ├── AdvancedSearchService
│   ├── EnterprisePricingService
│   ├── ESGReportingService
│   ├── WhiteLabelService
│   ├── PartnerApiService
│   ├── GovernmentTradeService
│   ├── MatchingEngineService
│   └── Controllers: Search, Platform, Enterprise
├── EmailModule
│   └── EmailService (SendGrid/Console fallback)
├── HealthModule
│   └── HealthController (/health, /ready, /live)
├── AuthModule
│   ├── AuthService (bcrypt, JWT)
│   ├── JwtStrategy
│   ├── JwtAuthGuard
│   └── User entity
├── AdminModule
│   ├── AdminService
│   └── AdminController
├── OrganizationsModule
│   ├── OrganizationsService
│   ├── SupplierQualityService
│   └── Organization + OrganizationMember entities
├── ProductsModule
│   ├── ProductsService
│   └── Product + ProductCategory entities
├── RfqsModule
│   ├── RfqsService
│   └── RFQ + Quotation entities
├── DealsModule
│   ├── DealsService
│   ├── ContractService
│   ├── DisputeResolutionService
│   ├── RefundCancellationService
│   ├── InsuranceReferralService
│   ├── LogisticsReferralService
│   └── Deal + DealMilestone + Dispute entities
├── MessagesModule
│   ├── MessagesService
│   ├── MessagesGateway (Socket.IO)
│   └── Message entity
├── ComplianceModule
│   ├── ComplianceService
│   ├── CertificateExpirationService
│   ├── CustomsTariffService
│   └── ComplianceRule + ComplianceChecklist entities
├── DocumentsModule
│   ├── DocumentsService
│   ├── UploadService (S3/Local)
│   └── Document entity
├── NotificationsModule
│   ├── NotificationsService
│   ├── NotificationsGateway (Socket.IO)
│   └── Notification entity
├── InspectionsModule
│   ├── InspectionsService
│   └── Inspection entity
├── UploadModule
│   └── UploadController (multer/S3)
├── PaymentsModule
│   ├── PaymentsService
│   ├── FlutterwaveService
│   ├── BankTransferProvider
│   └── Payment entity
├── WorkflowsModule
│   ├── WorkflowsService
│   └── Workflow entity (not yet created — uses in-memory)
└── AnalyticsModule
    ├── AnalyticsService
    └── AnalyticsController
```

---

## 3. Database Schema

### Entity Relationships
```
User 1:N OrganizationMember N:1 Organization
Organization 1:N Product
Organization 1:N Deal (as buyer or supplier)
Organization 1:N RFQ
Organization 1:N Payment
Deal 1:N DealMilestone
Deal 1:N Dispute
Deal 1:N Document
Deal 1:N Inspection
Deal 1:N Payment
RFQ 1:N Quotation
Product N:1 ProductCategory
User 1:N Message
User 1:N Notification
```

### Missing Entity
- **Workflow entity** — `WorkflowsService` references workflows but no entity exists. Currently using in-memory Map.

---

## 4. Critical System Questions

### 4.1 Authentication & Authorization

**Q1: Role-based access control (RBAC) is partially implemented but not enforced.**
- `AdminController` exists but there's no `@Roles()` decorator or role guard
- The `User` entity has a `role` field but it's not used for route-level access control
- **Decision needed:** Implement `RolesGuard` and `@Roles()` decorator before production

**Q2: JWT refresh token strategy is incomplete.**
- `JWT_REFRESH_SECRET` is configured but no refresh token endpoint exists
- Users will be forced to re-login every hour (default JWT_EXPIRES_IN)
- **Decision needed:** Implement `/auth/refresh` endpoint or extend token expiry

**Q3: Password policy is not enforced.**
- `RegisterDto` has basic validation but no password strength requirements
- **Decision needed:** Add minimum length, complexity rules, or integrate HaveIBeenPwned API

### 4.2 Data Integrity

**Q4: Soft delete vs hard delete is inconsistent.**
- Some entities have `deletedAt` columns but queries don't uniformly respect them
- TypeORM's `FindOptionsWhere` does not accept `null` for Date fields
- **Decision needed:** Standardize soft delete pattern across all modules

**Q5: No database migrations exist.**
- `synchronize: false` in production but no migration files are present
- First deployment will fail because TypeORM won't create tables
- **Decision needed:** Generate initial migration or set `synchronize: true` for first deploy

**Q6: Foreign key constraints are not explicitly defined.**
- Entity relations use TypeORM decorators but `onDelete` behavior is not specified
- Deleting an organization could orphan products, deals, etc.
- **Decision needed:** Add `onDelete: 'CASCADE'` or `RESTRICT` policies

### 4.3 Payments & Financial

**Q7: Payment simulation mode is the default.**
- If `FLUTTERWAVE_SECRET_KEY` is not set, all payments are simulated
- No clear indicator in the UI that payments are simulated
- **Decision needed:** Add a "sandbox mode" banner and require explicit opt-in

**Q8: No idempotency keys for payments.**
- Retrying a payment could create duplicate transactions
- **Decision needed:** Implement idempotency-key header for all payment operations

**Q9: Escrow logic is not implemented.**
- `DealMilestone` has `escrowStatus` field but no escrow release logic
- **Decision needed:** Define escrow workflow and implement release conditions

### 4.4 File Storage & Documents

**Q10: Document storage has a local/S3 duality that could cause data loss.**
- `UploadService` stores locally if S3 is not configured
- Local files are not persisted across container restarts
- **Decision needed:** Require S3 for production or mount persistent volume

**Q11: No file type or size validation in upload controller.**
- `UploadController` accepts any file without checking mime type or size
- **Decision needed:** Add file type whitelist and size limits

### 4.5 Real-time & Notifications

**Q12: WebSocket authentication is JWT-based but not verified on every message.**
- `MessagesGateway` and `NotificationsGateway` validate JWT on connection but not per-message
- **Decision needed:** Implement per-message auth or document the security model

**Q13: No message persistence guarantee.**
- Socket.IO messages are ephemeral; if a user is offline, messages may be lost
- **Decision needed:** Implement message queuing with Redis or persistent inbox

### 4.6 Compliance & Audit

**Q14: Audit logs are fire-and-forget with no persistence guarantee.**
- `AuditLogger` logs to repository but errors are swallowed
- No audit log retention policy
- **Decision needed:** Define retention period and ensure audit log durability

**Q15: GDPR/data privacy compliance is not addressed.**
- No data export or deletion endpoints for users
- No privacy policy integration
- **Decision needed:** Implement GDPR-compliant data handling

### 4.7 Performance & Scalability

**Q16: Rate limiting is in-memory only.**
- `RateLimitStore` uses a JavaScript Map — won't work across multiple instances
- **Decision needed:** Switch to Redis-backed rate limiting before horizontal scaling

**Q17: No database connection pooling is configured.**
- TypeORM `extra: { max: 20 }` is set but not tested under load
- **Decision needed:** Load test and tune connection pool size

**Q18: Analytics queries are unoptimized.**
- `AnalyticsService` uses multiple sequential queries that could be consolidated
- No materialized views or caching for analytics
- **Decision needed:** Optimize analytics queries or implement read replicas

### 4.8 Deployment & Operations

**Q19: Health check does not verify all dependencies.**
- `/health` checks database but not Redis, S3, or external APIs
- **Decision needed:** Add dependency health checks or accept partial verification

**Q20: No structured logging format.**
- Winston is configured but log format is not JSON-structured for log aggregation
- **Decision needed:** Configure JSON logging for ELK/CloudWatch integration

**Q21: Environment variable validation is incomplete.**
- Joi schema validates presence but not format (e.g., DATABASE_URL pattern)
- **Decision needed:** Add stricter validation or fail fast on misconfiguration

### 4.9 Frontend

**Q22: API error handling is inconsistent across pages.**
- Some pages show toast notifications, others silently fail
- **Decision needed:** Standardize error handling pattern (react-query error boundaries)

**Q23: No offline support or optimistic updates.**
- Network failures result in lost form data
- **Decision needed:** Implement optimistic UI or draft auto-save

---

## 5. Production Readiness Scorecard

| Area | Score | Blockers |
|------|-------|----------|
| Compilation | 10/10 | None |
| Build | 10/10 | None |
| Security (Auth) | 6/10 | RBAC, refresh tokens, password policy |
| Security (Input) | 7/10 | File upload validation |
| Data Integrity | 5/10 | No migrations, inconsistent soft delete |
| Payments | 6/10 | Simulation default, no idempotency |
| Observability | 5/10 | Basic health check, no structured logs |
| Scalability | 5/10 | In-memory rate limiting, no read replicas |
| Compliance | 4/10 | No GDPR, audit log retention unclear |
| Deployment | 7/10 | Docker configs correct, missing env validation |

**Overall: 6.5/10 — Ready for staging, not ready for production without addressing blockers.**

---

## 6. Recommended Priority Order

### P0 — Before Any Deployment
1. Generate TypeORM migration files
2. Add `HealthModule`, `AdminModule`, `EmailModule` to `AppModule` ✓ (Done)
3. Verify Docker healthcheck endpoint works ✓ (Done)

### P1 — Before Staging
4. Implement RBAC with `@Roles()` guard
5. Add file upload validation (type, size)
6. Add payment idempotency keys
7. Implement `/auth/refresh` endpoint
8. Add structured JSON logging

### P2 — Before Production
9. Switch rate limiting to Redis
10. Add comprehensive dependency health checks
11. Optimize analytics queries
12. Implement GDPR data export/deletion
13. Define audit log retention policy
14. Load test connection pooling

### P3 — Post-Production
15. Implement message queuing for offline users
16. Add optimistic UI and offline support
17. Implement escrow release logic
18. Add database read replicas

---

## 7. Environment Configuration Checklist

### Required for Startup
- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `JWT_SECRET` — Min 32 characters
- [ ] `JWT_REFRESH_SECRET` — Min 32 characters

### Required for Production
- [ ] `REDIS_URL` — For sessions and rate limiting
- [ ] `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` — For document storage
- [ ] `SENDGRID_API_KEY` — For email notifications
- [ ] `FLUTTERWAVE_SECRET_KEY` — For real payments

### Optional
- [ ] `TWILIO_*` — For SMS notifications
- [ ] `FRONTEND_URL` — For CORS (default: http://localhost:3000)

---

*Report generated by verification audit. Review and address each question before production deployment.*
