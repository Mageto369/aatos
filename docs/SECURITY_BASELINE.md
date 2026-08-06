# AATOS Security Baseline

**Version:** 1.0  
**Date:** 2026-08-06  
**Status:** Active

---

## 1. Authentication

### JWT Token Configuration
| Setting | Value | Notes |
|---------|-------|-------|
| Algorithm | HS256 | Consider RS256 for multi-service |
| Expiry | 1 hour (`JWT_EXPIRES_IN`) | Configurable via env |
| Issuer | `aatos-api` | Verified on validation |
| Audience | `aatos-client` | Verified on validation |
| Refresh tokens | Not implemented | P1 — see backlog |

### Token Payload
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "orgId": "org-uuid",
  "role": "admin"
}
```

### Multi-Factor Authentication
- TOTP-based (Google Authenticator compatible)
- Enforced for privileged roles (`owner`, `admin`)
- Optional for standard users
- Managed by `MfaService`

---

## 2. Authorization (RBAC)

### Role Hierarchy

| Role | Description | Typical Access |
|------|-------------|----------------|
| `owner` | Organization owner | Full access |
| `admin` | Organization admin | Full access except billing changes |
| `operator` | Day-to-day trader | Create/modify deals, RFQs, products |
| `finance_officer` | Financial operations | Payments, invoices, refunds |
| `compliance_officer` | Regulatory compliance | Compliance checklists, documents, inspections |
| `logistics_officer` | Shipping coordination | Inspections, logistics referrals |
| `viewer` | Read-only | View deals, documents, status |
| `agent` | External representative | Limited deal access |
| `support` | Customer support | Internal tools only |

### Guard Stack (Applied Globally)

```
All routes → JwtAuthGuard → RolesGuard
```

- **JwtAuthGuard:** Validates JWT signature, expiry, issuer, audience
- **RolesGuard:** Checks `@Roles()` decorator against user's org role

### Decorators

| Decorator | Usage |
|-----------|-------|
| `@Roles('admin', 'owner')` | Restrict to specific roles |
| `@CurrentUser()` | Inject user payload into handler |
| No `@Roles()` | Authenticated only (any role) |

---

## 3. Endpoint Protection

### Admin Endpoints
- `/admin/*` — `owner`, `admin` only
- Platform-wide statistics, user lists, organization management

### Finance Endpoints
- `POST /payments` — `owner`, `admin`, `finance_officer`
- `POST /payments/:id/initiate` — `owner`, `admin`, `finance_officer`
- `POST /payments/:id/release` — `owner`, `admin`, `finance_officer`
- `PATCH /payments/:id/status` — `owner`, `admin`, `finance_officer`

### Compliance Endpoints
- `POST /compliance/check` — `owner`, `admin`, `operator`, `compliance_officer`
- `GET /compliance/rules` — Any authenticated user

### Analytics Endpoints
- `GET /analytics/dashboard` — `owner`, `admin`
- `GET /analytics/growth` — `owner`, `admin`
- `GET /analytics/corridors` — `owner`, `admin`

---

## 4. Data Protection

### Encryption at Rest
- PostgreSQL: Managed by cloud provider (RDS/Cloud SQL)
- Application-level: Not implemented (consider field-level for PII)

### Encryption in Transit
- TLS 1.3 required for all connections
- HSTS header enforced
- API: HTTPS only

### Secrets Management
| Secret | Storage |
|--------|---------|
| JWT_SECRET | Environment variable |
| DATABASE_URL | Environment variable |
| Flutterwave keys | Environment variable |
| MFA secrets | Database (encrypted at rest by PostgreSQL) |

### Environment Configuration

```bash
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=<random-256-bit-string>

# Optional (defaults shown)
JWT_EXPIRES_IN=1h
DATABASE_SYNCHRONIZE=false  # Must be false in production
NODE_ENV=production
```

---

## 5. Input Validation

### Global Pipes
- `ValidationPipe` with `whitelist: true` (strips unknown properties)
- `transform: true` (auto-transform payloads to DTOs)

### File Uploads
- Max size: 10MB
- Allowed types: PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX
- Virus scanning: Not implemented (P2 — ClamAV or cloud solution)

---

## 6. Audit Logging

### Logged Events
- User login/logout
- Password changes
- MFA enable/disable
- Role changes
- Deal status changes
- Payment initiation/verification/release
- Document uploads
- Compliance checklist updates

### Log Schema
```sql
audit_logs (partitioned by month)
- id UUID
- entity_type VARCHAR
- entity_id UUID
- action VARCHAR
- actor_user_id UUID
- actor_org_id UUID
- metadata JSONB
- ip_address INET
- user_agent TEXT
- created_at TIMESTAMPTZ
```

### Retention
- Hot: 90 days in primary database
- Warm: 1 year in object storage (S3/Cloud Storage)
- Cold: 7 years (regulatory requirement)

---

## 7. Rate Limiting

### Current Implementation
- In-memory (per-instance)
- Configured per route via `@Throttle()` decorator
- Not shared across instances

### Production Requirement
- Switch to Redis-backed rate limiting
- Shared state across all API instances
- Configuration:
  ```
  default: 100 requests / 15 minutes
  auth endpoints: 5 requests / 15 minutes
  payment endpoints: 10 requests / 15 minutes
  ```

---

## 8. Dependency Security

### Known Vulnerabilities
Run weekly:
```bash
npm audit
# or
yarn audit
```

### Outdated Dependencies
Run monthly:
```bash
npm outdated
```

### CI/CD Integration
- Block merge if `npm audit` finds critical vulnerabilities
- Automated Dependabot alerts

---

## 9. Network Security

### Production Deployment
- API behind reverse proxy (Nginx/CloudFlare)
- WAF rules for common attack patterns
- DDoS protection enabled
- IP allowlisting for admin endpoints (optional)

### CORS Policy
```typescript
// Currently permissive — tighten for production
origin: ['https://aatos.trade', 'https://app.aatos.trade']
```

---

## 10. Incident Response

### Severity Levels
| Level | Criteria | Response Time |
|-------|----------|---------------|
| Critical | Data breach, payment fraud, complete outage | 1 hour |
| High | Unauthorized access, feature down | 4 hours |
| Medium | Performance degradation, partial outage | 24 hours |
| Low | Cosmetic issues, non-critical bugs | 72 hours |

### Escalation
1. On-call engineer notified via PagerDuty/Opsgenie
2. If unresolved in 1 hour → Engineering lead
3. If unresolved in 4 hours → CTO
4. If data breach → Legal + Executive immediately

---

## 11. Compliance & Certifications

### Target Certifications
| Certification | Priority | Timeline |
|---------------|----------|----------|
| SOC 2 Type II | P1 | 12-18 months post-launch |
| ISO 27001 | P2 | 18-24 months |
| GDPR compliance | P1 | Before EU users |

### Data Residency
- Default: U.S. (AWS us-east-1 / us-west-2)
- EU: Frankfurt (gdpr-region flag)
- Kenya: Nairobi (africa-region flag)

---

## 12. Security Checklist (Pre-Launch)

- [x] JWT authentication implemented
- [x] RBAC with role guards implemented
- [x] MFA for privileged users
- [x] Password hashing (bcrypt)
- [x] Input validation (class-validator)
- [x] Audit logging
- [ ] Rate limiting via Redis (P2)
- [ ] External penetration test (P1)
- [ ] Secrets rotation policy (P2)
- [ ] Security headers (HSTS, CSP, X-Frame-Options) (P2)
- [ ] Automated vulnerability scanning (P2)

---

## 13. Contact

| Role | Contact | Escalation |
|------|---------|------------|
| Security Lead | security@aatos.trade | CTO |
| Incident Response | incident@aatos.trade | +1-XXX-XXX-XXXX |
| Legal | legal@aatos.trade | CEO |

---

*Document version: 1.0*  
*Last updated: 2026-08-06*  
*Next review: 2026-09-06*
