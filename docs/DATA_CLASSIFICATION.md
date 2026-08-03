# Data Classification Policy
**Version:** 1.0
**Effective:** 2026-08-04
**Authority:** AATOS Autonomous Execution Master Directive

---

## Classification Levels

| Level | Definition | Examples | Handling |
|---|---|---|---|
| **Public** | Information that can be freely shared | Marketing content, public product listings, published prices | No restrictions |
| **Internal** | Business information not for public release | Roadmaps, metrics, internal processes | Employees and contractors only |
| **Confidential** | Sensitive business or user information | Contracts, deal terms, negotiation history | Need-to-know basis, encrypted at rest |
| **Restricted** | Highly sensitive information | Banking details, identity documents, risk scores | Encryption, access logs, MFA required |
| **Financial** | Payment and financial data | Transaction amounts, payment provider tokens | Encrypted, tokenized where possible, audit logs |
| **Identity** | Personal and organizational identity | Passports, business registrations, tax IDs | Encryption, limited retention, consent required |
| **Compliance** | Regulatory and legal data | Inspection reports, certifications, sanctions checks | Encryption, long retention, audit trail |
| **Trade Secret** | Proprietary business information | Algorithms, pricing models, supplier relationships | Encryption, NDA required, minimal access |

---

## Data Handling Rules

### Collection
- Collect only the minimum information required for the stated purpose
- Document the purpose for each data field
- Obtain consent where required by law

### Access
- Role-based access control enforced at application level
- Object-level authorization for all sensitive records
- Access logs maintained for Restricted and Financial data

### Retention
| Data Type | Retention Period | Rationale |
|---|---|---|
| Transaction records | 7 years | Regulatory requirement |
| Audit logs | 7 years | Compliance and dispute resolution |
| User accounts | 2 years after last activity | Business need |
| Identity documents | 5 years after verification | Compliance |
| Chat messages | 3 years after deal completion | Dispute resolution |
| Failed login attempts | 90 days | Security monitoring |

### Deletion
- Soft deletes for audit trail preservation
- Hard delete available upon verified user request (GDPR/POPIA)
- Anonymization for analytics after retention period

### Export
- Users may request export of their data
- Export provided in machine-readable format within 30 days
- Organization admins may export organization data

---

## Encryption Requirements

| Data Type | At Rest | In Transit |
|---|---|---|
| Passwords | bcrypt (cost factor 12+) | N/A |
| JWT secrets | Environment variables, key vault | TLS 1.3 |
| Identity documents | AES-256 | TLS 1.3 |
| Banking information | AES-256, tokenized | TLS 1.3 |
| Transaction data | AES-256 | TLS 1.3 |
| Chat messages | AES-256 | TLS 1.3 |

---

## Cross-Border Transfers

Data may be processed in:
- United States (primary infrastructure)
- Kenya (pilot operations)
- European Union (if GDPR applies)

Transfers outside these jurisdictions require:
- Adequacy determination or
- Standard contractual clauses or
- User consent

---

*Policy subject to legal counsel review for specific jurisdictions.*
