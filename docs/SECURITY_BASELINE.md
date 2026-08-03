# Security Baseline
**Version:** 1.0
**Effective:** 2026-08-04
**Authority:** AATOS Autonomous Execution Master Directive

---

## Authentication

| Control | Status | Implementation |
|---|---|---|
| JWT tokens | Implemented | HS256/RS256, 1h expiry |
| Refresh tokens | Implemented | 7 day expiry, rotation recommended |
| Password hashing | Implemented | bcrypt, cost factor 12+ |
| Login throttling | Implemented | 5 attempts, 15 min lockout |
| MFA (TOTP) | UI exists, backend partial | Settings page has UI; verification logic incomplete |
| Session revocation | Not implemented | Required before production |

## Authorization

| Control | Status | Implementation |
|---|---|---|
| Organization scoping | Partial | Some endpoints check orgId; audit required for all |
| Role-based access | Partial | Roles defined; enforcement inconsistent |
| Object-level auth | Not implemented | Required before production |
| Admin privileges | Implemented | Admin role exists |

## Infrastructure

| Control | Status | Implementation |
|---|---|---|
| HTTPS/TLS | Required | All traffic encrypted |
| Helmet headers | Implemented | Security headers set |
| CORS | Implemented | Configured for frontend origin |
| Rate limiting | Implemented | Throttler module |
| Compression | Implemented | gzip |

## Data Protection

| Control | Status | Implementation |
|---|---|---|
| Encryption at rest | Partial | Database encryption depends on provider (Supabase) |
| Encryption in transit | Implemented | TLS 1.2+ |
| Secret management | Weak | .env files; no key vault yet |
| Audit logging | Not implemented | Required before production |

## File Uploads

| Control | Status | Implementation |
|---|---|---|
| S3 presigned URLs | Implemented | Direct upload to S3 |
| File type validation | Partial | Extension check; MIME validation needed |
| Malware scanning | Not implemented | ClamAV integration planned |
| Size limits | Unknown | Not configured |

## Webhooks

| Control | Status | Implementation |
|---|---|---|
| Signature verification | Not implemented | Critical for payment webhooks |
| Replay protection | Not implemented | Required |
| IP allowlisting | Not implemented | Recommended |

## Dependencies

| Control | Status | Notes |
|---|---|---|
| Dependency scanning | Not implemented | npm audit, Snyk, or Dependabot needed |
| Secret scanning | Not implemented | GitHub secret scanning or gitleaks needed |
| Container scanning | Not implemented | Required if containerized |

---

## Required Before Production

1. **MFA backend completion**
2. **Object-level authorization audit**
3. **Webhook signature verification**
4. **Audit logging system**
5. **Secret management (key vault)**
6. **Malware scanning**
7. **Dependency scanning**
8. **Penetration test**

---

*Baseline subject to security audit before production deployment.*
