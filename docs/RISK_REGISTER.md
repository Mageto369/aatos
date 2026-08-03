# AATOS Risk Register

**Created:** 2026-08-04
**Source:** Repository Audit against MASTER_QUESTIONER.md
**Classification:** INTERNAL — Executive & Board Review

---

## Risk Scoring

| Dimension | Weight |
|---|---|
| Likelihood | 1-5 (rare to almost certain) |
| Impact | 1-5 (minor to catastrophic) |
| Velocity | 1-5 (slow to immediate) |
| **Risk Score** | **Likelihood × Impact × Velocity** |

Thresholds:
- **Critical:** Score ≥ 80
- **High:** Score 40-79
- **Medium:** Score 20-39
- **Low:** Score < 20

---

## Critical Risks (Score ≥ 80)

### R001: Escrow is Simulated, Not Real
**Question:** Q50
**Evidence:** `payments.service.ts:156` — "In production: trigger Flutterwave transfer"; `flutterwave.service.ts:120` — "Escrow is simulated"
**Likelihood:** 5 (certain on current path)
**Impact:** 5 (catastrophic — trust failure, liability)
**Velocity:** 4 (immediate at first failed trade)
**Score:** 100
**Description:** Architecture claims escrow. Code simulates it. When a real trade fails, buyer has no protection. Platform liability is unlimited.
**Mitigation:**
1. Implement real escrow via Flutterwave subaccounts within 30 days
2. OR remove escrow claims and operate as payment facilitator with clear terms
3. OR partner with escrow provider before first real trade
**Owner:** Engineering / Executive
**Status:** OPEN
**Trigger:** First transaction > $1,000

---

### R002: No Compliance Rules Populated
**Question:** Q37, Q38, Q39, Q44
**Evidence:** `compliance.service.ts` — rule lookup exists but `compliance_rules` table has zero data in repo
**Likelihood:** 5 (certain — no data exists)
**Impact:** 5 (catastrophic — customs seizures, legal liability)
**Velocity:** 4 (immediate upon first shipment)
**Score:** 100
**Description:** The compliance engine is an empty shell. No SPS rules. No certificate rules. No tariff data. Any trade facilitated is non-compliant by default.
**Mitigation:**
1. License compliance data from Thomson Reuters, Descartes, or similar
2. Hire compliance analyst for each pilot corridor
3. Partner with customs broker for rule verification
4. DO NOT facilitate physical trade until rules are populated
**Owner:** Compliance / Executive
**Status:** OPEN
**Trigger:** Any trade involving physical goods crossing a border

---

### R003: No Terms of Service or Liability Framework
**Question:** Q105, Q106, Q30
**Evidence:** No legal documents in repository. No jurisdiction. No liability cap.
**Likelihood:** 5 (certain — documents don't exist)
**Impact:** 5 (catastrophic — unlimited liability, regulatory action)
**Velocity:** 3 (builds with each user, accelerates at first dispute)
**Score:** 75 → **CRITICAL** (escalating)
**Description:** Platform operates without legal foundation. Every trade creates unbounded liability. Disputes have no resolution framework.
**Mitigation:**
1. Engage legal counsel immediately
2. Draft terms of service with liability cap
3. Specify dispute resolution mechanism
4. Require user acceptance before any trade
**Owner:** Legal / Executive
**Status:** OPEN
**Trigger:** First registered user

---

### R004: No AML/KYC Implementation
**Question:** Q110
**Evidence:** `verification_level` enum exists but no KYC enforcement. Flutterwave handles its own KYC but platform does not.
**Likelihood:** 4 (high in regulated corridors)
**Impact:** 5 (catastrophic — regulatory fines, account freezing)
**Velocity:** 3 (may take months to trigger, but severe when it does)
**Score:** 60 → **HIGH** (escalating to critical in regulated markets)
**Description:** Platform facilitates payments but has no AML program. Regulatory bodies (CBN, BoG, CBK) will require KYC for payment facilitation.
**Mitigation:**
1. Implement tiered KYC before accepting payments
2. Partner with KYC provider (Onfido, Smile Identity)
3. Limit payment size for unverified users
**Owner:** Compliance / Engineering
**Status:** OPEN
**Trigger:** Regulatory inquiry or payment processor audit

---

### R005: No Test Suite Exists Despite Claims
**Question:** Q81
**Evidence:** `DEV_STATUS.md` claims "comprehensive test coverage"; zero `.spec.ts` or `.test.ts` files found
**Likelihood:** 5 (confirmed — no tests)
**Impact:** 4 (severe — production bugs, data loss)
**Velocity:** 4 (immediate on every deployment)
**Score:** 80 → **CRITICAL**
**Description:** Deploying untested code to production is reckless. The claim in DEV_STATUS creates false confidence.
**Mitigation:**
1. Write tests for critical paths immediately
2. Remove false claim from DEV_STATUS
3. Implement CI/CD with test gates
4. Manual QA for every release until test coverage > 60%
**Owner:** Engineering
**Status:** OPEN
**Trigger:** Every deployment

---

### R006: Database `synchronize: true` in Production
**Question:** Q80
**Evidence:** `database.module.ts` — TypeORM `synchronize: true`
**Likelihood:** 4 (high if deployed to production)
**Impact:** 5 (catastrophic — data loss, schema corruption)
**Velocity:** 4 (immediate on schema change)
**Score:** 80 → **CRITICAL**
**Description:** `synchronize: true` auto-modifies database schema. In production, this can drop columns, delete data, or create inconsistent states.
**Mitigation:**
1. Disable `synchronize` immediately
2. Generate TypeORM migrations for existing schema
3. Implement migration verification in CI/CD
**Owner:** Engineering
**Status:** OPEN
**Trigger:** Any production deployment

---

### R007: No Dispute Resolution Process
**Question:** Q25, Q26, Q57
**Evidence:** No dispute entity, no workflow, no legal framework
**Likelihood:** 5 (certain — disputes are inevitable)
**Impact:** 4 (severe — reputation damage, chargebacks)
**Velocity:** 3 (weeks to months)
**Score:** 60 → **HIGH**
**Description:** When a buyer receives substandard goods or a supplier is not paid, there is no resolution path. Chargebacks, legal threats, and reputation damage follow.
**Mitigation:**
1. Define dispute process in terms of service
2. Implement ticket/escalation system
3. Set up mediation workflow
4. Reserve dispute resolution fund
**Owner:** Legal / Product
**Status:** OPEN
**Trigger:** First dispute

---

## High Risks (Score 40-79)

### R008: No Disaster Recovery Plan
**Question:** Q71
**Evidence:** No DR documentation. Staging-only deployment docs.
**Likelihood:** 3 (moderate)
**Impact:** 5 (catastrophic)
**Velocity:** 2 (slow until incident)
**Score:** 30 → **MEDIUM** (but Impact is catastrophic)
**Mitigation:** Define RTO/RPO. Implement backups. Document recovery.
**Owner:** Engineering

---

### R009: Single Payment Provider (Flutterwave)
**Question:** Q51
**Evidence:** Only Flutterwave integrated. No fallback.
**Likelihood:** 3 (moderate — Flutterwave is reliable)
**Impact:** 4 (severe if unavailable)
**Velocity:** 2 (slow)
**Score:** 24 → **MEDIUM**
**Mitigation:** Add secondary provider (Stripe, Paystack). Implement provider failover.
**Owner:** Engineering / Finance

---

### R010: No Trade Finance
**Question:** Q22, Q55
**Evidence:** No trade finance module. `org_type` has `trade_finance` but no functionality.
**Likelihood:** 4 (certain for international B2B)
**Impact:** 4 (severe — lost revenue, uncompetitive)
**Velocity:** 3 (moderate)
**Score:** 48 → **HIGH**
**Mitigation:** Partner with bank or trade finance platform. Referral model for pilot.
**Owner:** Executive / Finance

---

### R011: No Fraud Detection
**Question:** Q122
**Evidence:** No fraud logic anywhere.
**Likelihood:** 4 (high — trade platforms attract fraud)
**Impact:** 4 (severe — financial loss)
**Velocity:** 3 (moderate)
**Score:** 48 → **HIGH**
**Mitigation:** Implement transaction monitoring. Set velocity limits. Flag anomalous patterns.
**Owner:** Compliance / Engineering

---

### R012: No Document Verification
**Question:** Q47
**Evidence:** Documents can be uploaded but not verified against issuers.
**Likelihood:** 4 (high)
**Impact:** 4 (severe — compliance failure, liability)
**Velocity:** 3 (moderate)
**Score:** 48 → **HIGH**
**Mitigation:** Integrate with certifying bodies. Hash and timestamp documents. Manual spot-checks.
**Owner:** Compliance / Engineering

---

### R013: No Supplier Quality Scoring
**Question:** Q8
**Evidence:** `trust_score` field exists but is never updated.
**Likelihood:** 5 (certain — no scoring logic)
**Impact:** 3 (moderate — poor matching)
**Velocity:** 3 (moderate)
**Score:** 45 → **HIGH**
**Mitigation:** Define scoring formula. Implement rating system after each deal.
**Owner:** Product / Engineering

---

### R014: No Analytics or PMF Measurement
**Question:** Q77, Q104
**Evidence:** No analytics module. No event tracking.
**Likelihood:** 5 (certain)
**Impact:** 3 (moderate — flying blind)
**Velocity:** 3 (moderate)
**Score:** 45 → **HIGH**
**Mitigation:** Implement event tracking (Segment, Mixpanel). Define PMF metrics.
**Owner:** Product / Engineering

---

### R015: No Insurance Integration
**Question:** Q64
**Evidence:** `org_type` has `insurer` but no insurance module.
**Likelihood:** 3 (moderate)
**Impact:** 4 (severe — cargo loss)
**Velocity:** 2 (slow)
**Score:** 24 → **MEDIUM**
**Mitigation:** Recommend buyers obtain insurance. Add integration in v2.
**Owner:** Product

---

### R016: No Structured Logging or Monitoring
**Question:** Q84, Q124
**Evidence:** Basic exception filter. No structured logging. No monitoring dashboards.
**Likelihood:** 4 (high)
**Impact:** 3 (moderate — debugging difficulty)
**Velocity:** 3 (moderate)
**Score:** 36 → **MEDIUM**
**Mitigation:** Implement Pino/Winston. Add Datadog/Grafana. Set up alerting.
**Owner:** Engineering

---

### R017: No Access Control Documentation
**Question:** Q94
**Evidence:** No production access model.
**Likelihood:** 3 (moderate)
**Impact:** 4 (severe — unauthorized access)
**Velocity:** 2 (slow)
**Score:** 24 → **MEDIUM**
**Mitigation:** Define IAM policy. Implement least-privilege access. Document access matrix.
**Owner:** Engineering

---

### R018: No Data Retention Policy
**Question:** Q73
**Evidence:** Soft delete only. No retention schedule.
**Likelihood:** 4 (high)
**Impact:** 3 (moderate — regulatory risk)
**Velocity:** 3 (moderate)
**Score:** 36 → **MEDIUM**
**Mitigation:** Define retention policy. Implement automated purging. Add data export.
**Owner:** Legal / Engineering

---

## Medium Risks (Score 20-39)

### R019: No Cold Chain Tracking
**Question:** Q65
**Evidence:** No temperature tracking.
**Likelihood:** 2 (low for dry commodities)
**Impact:** 3 (moderate)
**Velocity:** 2 (slow)
**Score:** 12 → **LOW**
**Owner:** Product

---

### R020: No Mobile App (Stub Only)
**Question:** Q75
**Evidence:** Mobile directory exists but is minimal.
**Likelihood:** 3 (moderate)
**Impact:** 2 (minor for pilot)
**Velocity:** 2 (slow)
**Score:** 12 → **LOW**
**Owner:** Product / Engineering

---

### R021: No Feature Flags
**Question:** Q82
**Evidence:** No feature flag system.
**Likelihood:** 3 (moderate)
**Impact:** 2 (minor)
**Velocity:** 2 (slow)
**Score:** 12 → **LOW**
**Owner:** Engineering

---

### R022: No CI/CD Pipeline
**Question:** Q79
**Evidence:** Docker exists but no automated pipeline.
**Likelihood:** 3 (moderate)
**Impact:** 2 (minor for pilot)
**Velocity:** 2 (slow)
**Score:** 12 → **LOW**
**Owner:** Engineering

---

### R023: No Go-to-Market Strategy
**Question:** Q97, Q98
**Evidence:** No GTM documentation.
**Likelihood:** 5 (certain)
**Impact:** 3 (moderate — no customers)
**Velocity:** 3 (moderate)
**Score:** 45 → **HIGH**
**Mitigation:** Define GTM strategy. Set acquisition channels. Allocate marketing budget.
**Owner:** Executive / Marketing

---

### R024: Unknown Runway
**Question:** Q118
**Evidence:** No financial data in repository.
**Likelihood:** 5 (certain — unknown)
**Impact:** 5 (catastrophic if short)
**Velocity:** 3 (moderate)
**Score:** 75 → **HIGH**
**Description:** If runway is <6 months and unknown, company may cease operations before launch.
**Mitigation:** Immediate financial disclosure. Secure bridge if needed.
**Owner:** Executive / Finance
**Status:** OPEN

---

## Risk Summary Matrix

| Risk | Score | Status | Owner |
|---|---|---|---|
| R001 Simulated Escrow | 100 | OPEN | Engineering |
| R002 Empty Compliance | 100 | OPEN | Compliance |
| R003 No Legal Framework | 75 | OPEN | Legal |
| R005 No Tests | 80 | OPEN | Engineering |
| R006 Synchronize True | 80 | OPEN | Engineering |
| R004 No AML/KYC | 60 | OPEN | Compliance |
| R007 No Dispute Resolution | 60 | OPEN | Legal |
| R010 No Trade Finance | 48 | OPEN | Executive |
| R011 No Fraud Detection | 48 | OPEN | Compliance |
| R012 No Doc Verification | 48 | OPEN | Compliance |
| R024 Unknown Runway | 75 | OPEN | Executive |

---

*End of Risk Register*
