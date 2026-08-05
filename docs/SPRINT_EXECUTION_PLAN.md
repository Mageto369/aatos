# AATOS 4-Week Sprint — Execution Plan
**Date:** 2026-08-05
**Sprint Name:** Trust Evidence Sprint
**Sprint Goal:** Replace claims with evidence. Replace stubs with verified code. Replace architecture diagrams with end-to-end transactions.

---

## Sprint Philosophy

This sprint does not reward task completion.
It rewards evidence.

A completed task with no proof is a zero.
A claim that remains unverified is a defect.
A passing test that does not match production behavior is a lie.

The only acceptable output is a verified, auditable, reproducible result.

---

## Final Decision Framework (Three Outcomes Only)

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| **Pilot Approved** | All 12 L3 items verified. 100% pilot transaction runs without manual database edits. Zero unverified claims remain. All critical risks closed or accepted with mitigations. | Proceed to commercial pilot with 5 suppliers, 5 buyers, Kenya→US, green coffee |
| **Pilot Conditionally Approved** | 10+ L3 items verified. 90%+ pilot transaction runs without manual edits. 3 or fewer unverified claims remain. 2 or fewer critical risks open with documented mitigations. | Proceed with manual operational oversight. 30-day remediation period before removing manual checks |
| **Pilot Blocked** | Fewer than 10 L3 items verified. Less than 90% pilot transaction runs without manual edits. More than 3 unverified claims remain. More than 2 critical risks open without mitigations. | Stop. Replan. Do not attempt pilot operations |

**Sprint complete does not equal pilot approved.** A completed sprint with a broken transaction is a failed pilot gate.

---

## Revised Evidence Targets

| Level | Before Sprint | After Sprint | Target |
|-------|--------------|-------------|--------|
| **L0 — No Evidence** | 60 | < 30 | Remove 30+ items |
| **L1 — Decision Documented** | 16 | All major decisions | Every legal and strategic decision written down |
| **L2 — Implemented in Code** | 67 | ≥ 85 | Add 18+ verified implementations |
| **L3 — Verified by Tests or Production** | 0 | ≥ 12 | These 12 items must have passing tests |

### Minimum L3 Set (Non-Negotiable)

Each item below must have:
- Passing unit tests
- Passing integration tests
- Production-like environment verification
- Documentation of expected vs. actual behavior

| # | Item | Current | Target |
|---|------|---------|--------|
| 1 | Authentication | L2 | L3 |
| 2 | Organization isolation | L2 | L3 |
| 3 | Supplier verification | L1 | L3 |
| 4 | Buyer verification | L1 | L3 |
| 5 | RFQ flow | L2 | L3 |
| 6 | Quotation flow | L2 | L3 |
| 7 | Deal conversion | L2 | L3 |
| 8 | Document review | L1 | L3 |
| 9 | Compliance checklist | L1 | L3 |
| 10 | Payment webhook | L1 | L3 |
| 11 | Audit logging | L1 | L3 |
| 12 | Backup restoration | L0 | L3 |

---

## Weekly Gates

### Week 1: Truth and Legal Foundation
**Theme:** No unverified claims survive.

#### Required Outputs

| # | Output | Evidence Standard | Owner |
|---|--------|-------------------|-------|
| 1 | `synchronize: true` removed from TypeORM config | Git commit + migration verified + build passes | Engineering |
| 2 | All false escrow claims corrected | ARCHITECTURE.md updated. Escrow marked as "simulated — production integration required" | Engineering |
| 3 | All false testing claims corrected | DEV_STATUS.md updated. Test coverage claims removed or replaced with actual metrics | Engineering |
| 4 | All false OAuth claims corrected | API_SPECIFICATION.md updated. OAuth 2.0 marked as "planned — JWT implemented" | Engineering |
| 5 | All false production-readiness claims corrected | All docs audited for accuracy. Claims either removed or replaced with evidence | Engineering |
| 6 | Terms of Service draft | Document exists, reviewed, covers liability, jurisdiction, dispute resolution, payment terms, data use | Legal |
| 7 | Privacy Policy draft | GDPR/POPIA compliant, covers data collection, retention, deletion, user rights, DPO contact | Legal |
| 8 | Liability framework | Document defines platform liability cap, excluded liabilities, insurance requirements, indemnification | Legal |
| 9 | Platform-role statement | Document defines AATOS role (facilitator vs. principal), escrow duties (or lack thereof), dispute neutrality | Legal |
| 10 | Kenya to U.S. green coffee compliance source register | Document listing: SPS requirements (USDA APHIS), phyto certificates (KEPHIS), certificate of origin (AfCFTA), aflatoxin limits (USDA), organic equivalence (NOP vs. EU organic), customs docs (CBP), tariff (HTS 0901.11) | Compliance |
| 11 | Clean branch history | No force pushes. Meaningful commit messages. All work on feature branches. PR review required | Engineering |

#### Week 1 Pass Criteria

- [ ] Every public and internal claim matches the code
- [ ] No document claims a feature that is not implemented
- [ ] All L1 items have evidence of review (not just creation)
- [ ] Git history is auditable

#### Week 1 Fail Criteria

- Any unverified claim remains in any document
- `synchronize: true` still active
- No legal framework document exists
- Git history is messy or unrecoverable

---

### Week 2: Verification and Compliance
**Theme:** One supplier and one buyer must move through full verification.

#### Required Outputs

| # | Output | Evidence Standard | Owner |
|---|--------|-------------------|-------|
| 1 | Supplier verification workflow | Code: document upload → status review → approval/rejection → notification. Test: one supplier completes flow | Engineering |
| 2 | Buyer verification workflow | Code: document upload → status review → approval/rejection → notification. Test: one buyer completes flow | Engineering |
| 3 | Organization ownership and membership model confirmed | Document: who can invite, who can approve, role permissions, ownership transfer. Code: enforcement in guards | Engineering + Legal |
| 4 | Sanctions screening workflow | Code: OFAC/UN/EU list checks on registration and deal creation. Test: hit/miss scenarios | Engineering |
| 5 | PEP and adverse-risk workflow | Code: Politically Exposed Person check. Test: flagged individual blocked or escalated | Engineering |
| 6 | Coffee compliance checklist | Auto-generated checklist for Kenya→US green coffee based on compliance rules. Test: checklist created for sample deal | Engineering + Compliance |
| 7 | Document-review workflow | Code: uploaded document → type detection → status tracking → approval. Test: document moves through states | Engineering |
| 8 | Certificate expiration tracking | Code: certificates have expiry dates. Notifications at 30/60/90 days. Test: expiry triggers alert | Engineering |
| 9 | Manual verification playbook | Document: step-by-step process for human reviewer to verify supplier/buyer. Includes decision criteria, escalation path, SLAs | Operations |

#### Week 2 Pass Criteria

- [ ] One real (test) supplier completes full verification flow without database edits
- [ ] One real (test) buyer completes full verification flow without database edits
- [ ] Sanctions screening blocks a test flagged entity
- [ ] Compliance checklist auto-generates for Kenya→US coffee
- [ ] Manual playbook exists and is readable by a non-engineer

#### Week 2 Fail Criteria

- Verification flow requires database edits
- Sanctions screening does not block test cases
- Compliance checklist is empty or manual
- No playbook exists

---

### Week 3: Production Engineering
**Theme:** Clean environment. Verified build. Passing tests. Working restore.

#### Required Outputs

| # | Output | Evidence Standard | Owner |
|---|--------|-------------------|-------|
| 1 | Database migrations verified | Migrations apply cleanly to empty database. Migrations apply incrementally to existing database. Rollback tested | Engineering |
| 2 | `synchronize` disabled | Config file shows `synchronize: false`. Build fails if attempted | Engineering |
| 3 | Critical unit tests | Auth, organizations, deals, payments, messages, RFQs, quotations, documents, compliance, inspections | Engineering |
| 4 | Critical integration tests | API endpoints with database. Auth flow. Deal creation. Payment webhook | Engineering |
| 5 | Authorization tests | User A cannot see User B's data. Member cannot admin. Unauthenticated blocked | Engineering |
| 6 | Quotation-to-deal end-to-end test | RFQ → quotation → counteroffer → accepted revision → deal creation. Full flow in one test | Engineering |
| 7 | Payment webhook verification | Webhook signature verified. Idempotency handled. Duplicate events rejected. Test with Flutterwave test events | Engineering |
| 8 | Audit logging | All state changes logged (who, what, when, before, after). Logs are append-only. Test: action creates log entry | Engineering |
| 9 | Rate limiting | Configured per endpoint. Test: excessive requests throttled | Engineering |
| 10 | MFA for privileged users | Admin users required MFA. Test: login without MFA fails for admin | Engineering |
| 11 | Backup and restore test | Database backup taken. Backup restored to clean environment. Application starts. Data verified | Engineering |
| 12 | Application monitoring | Health checks, error tracking, performance metrics. Dashboard accessible. Alert on failure | Engineering |

#### Week 3 Pass Criteria

- [ ] Clean environment builds from scratch (`git clone → npm install → migrate → seed → start`)
- [ ] All migrations apply without error
- [ ] All tests pass (>80% coverage on critical paths)
- [ ] Restore from backup succeeds and data is intact
- [ ] Monitoring dashboard shows application health

#### Week 3 Fail Criteria

- Build fails on clean environment
- Any migration fails
- Test coverage < 60% on critical paths
- Restore fails or data is corrupted
- No monitoring visible

---

### Week 4: Pilot Simulation
**Theme:** Full transaction without database edits.

#### Required Outputs

| # | Output | Evidence Standard | Owner |
|---|--------|-------------------|-------|
| 1 | Five supplier records | Created through UI/API. Verified through workflow. Realistic data (Kenyan coffee suppliers) | Product |
| 2 | Five buyer records | Created through UI/API. Verified through workflow. Realistic data (US coffee roasters/importers) | Product |
| 3 | Green coffee product data | Products created by suppliers. Categories, grades, certifications, pricing | Product |
| 4 | RFQ | Buyer creates RFQ for green coffee. System generates compliance pre-check | Product |
| 5 | Two quotations | Suppliers submit quotations. System validates terms | Product |
| 6 | Counteroffer | Buyer counters one quotation. System tracks revision | Product |
| 7 | Accepted revision | Supplier accepts counteroffer. System creates deal | Product |
| 8 | Deal | Deal room active. Milestones defined. Compliance checklist attached | Product |
| 9 | Contract | Contract generated. Acceptance recorded | Product |
| 10 | Compliance checklist | Auto-generated for Kenya→US coffee. All items tracked | Product |
| 11 | Document review | Documents uploaded. Reviewed. Approved/rejected | Product |
| 12 | Inspection | Inspection booked. Scheduled. Results recorded | Product |
| 13 | Payment milestone | Milestone payment triggered. Webhook received. Status updated | Product |
| 14 | Dispute test | Simulated dispute raised. Tracked in system. Resolution recorded | Product |
| 15 | Complete audit trail | Every action logged. Queryable by deal. Immutable | Engineering |

#### Week 4 Pass Criteria

- [ ] Full workflow completes without direct database edits
- [ ] Every step is traceable in audit logs
- [ ] No manual interventions required
- [ ] All 12 L3 items have passing tests
- [ ] Pilot transaction completion = 100%

#### Week 4 Fail Criteria

- Any step requires database edit
- Audit trail is incomplete
- Test coverage < 80% on critical paths
- L3 items < 10 verified

---

## Weekly Tracking Metrics

### Primary Metric: Pilot Transaction Completion

| Week | Target | Measurement |
|------|--------|-------------|
| Week 1 | 20% | Legal framework + compliance source register enable first steps |
| Week 2 | 45% | Verification workflows enable supplier/buyer onboarding |
| Week 3 | 75% | Production hardening enables reliable transaction processing |
| Week 4 | 100% | Full end-to-end transaction without manual intervention |

**Measurement method:** Count the 15 steps in the Week 4 pilot simulation. Track how many complete through UI/API only. Database edits disqualify the step.

### Secondary Metrics

| Metric | Week 1 | Week 2 | Week 3 | Week 4 | Target |
|--------|--------|--------|--------|--------|--------|
| Unverified claims remaining | All claims audited | < 10 | < 5 | 0 | 0 |
| Critical risks open | All risks identified | < 5 | < 3 | ≤ 2 | ≤ 2 |
| Tests passing | N/A | N/A | > 80% | > 90% | > 90% |
| Authorization failures found | N/A | N/A | 0 | 0 | 0 |
| Manual interventions per transaction | N/A | < 5 | < 3 | 0 | 0 |
| Documents requiring offline handling | All identified | < 5 | < 3 | 0 | 0 |
| Steps completed outside AATOS | All identified | < 5 | < 3 | 0 | 0 |

### Metric Definitions

| Metric | Definition | How to Track |
|--------|-----------|--------------|
| **Unverified claims** | Any statement in any document that claims a feature exists without test or production evidence | Weekly document audit. Flag claims. Verify or remove |
| **Critical risks** | Risks from RISK_REGISTER.md with severity = Critical or High | Risk register review. Close or accept with mitigation |
| **Tests passing** | Percentage of tests that pass in CI/CD pipeline | CI/CD dashboard. Fail sprint if < target |
| **Authorization failures** | Security tests where user accesses data they should not | Auth test suite. Any failure = sprint blocked |
| **Manual interventions** | Any action requiring direct database edit, API bypass, or admin override | Transaction log review. Count manual steps |
| **Offline documents** | Documents that exist only outside AATOS (spreadsheets, emails, paper) | Document inventory. All pilot docs must be in system |
| **Steps outside AATOS** | Transaction steps handled by external tools (email for messaging, spreadsheets for tracking) | Transaction audit. All steps must be in-platform |

---

## Daily Standup Template

Each day, report on:

1. **Evidence created yesterday** (not tasks completed)
2. **Evidence needed today** (not tasks planned)
3. **Blockers to evidence** (not blockers to tasks)

Example:

> Yesterday: Supplier verification workflow code written. **Evidence needed:** Test with realistic document upload.
> Today: Run verification test. Capture screen recording or test output.
> Blocker: No realistic supplier document examples.

---

## Sprint Artifacts

### Required by End of Sprint

| Artifact | Description | Owner |
|----------|-------------|-------|
| **Sprint Evidence Log** | Daily record of all evidence created, tests run, verifications performed | Engineering Lead |
| **L3 Verification Report** | For each of 12 L3 items: test results, environment, date, verifier | QA Lead |
| **Transaction Evidence** | Screen recording or automated test output of full pilot transaction | Product |
| **Claim Audit** | List of all claims removed, corrected, or verified with evidence | Engineering Lead |
| **Risk Register Update** | Updated risks, closed risks, accepted risks with mitigations | Legal/Compliance |
| **Pilot Decision Memo** | Pilot Approved, Conditionally Approved, or Blocked. With justification | Sprint Lead |

---

## Sprint Team

| Role | Responsibility |
|------|---------------|
| **Sprint Lead** | Owns sprint outcome. Makes go/no-go decision. Removes blockers |
| **Engineering Lead** | Owns code quality, test coverage, production readiness |
| **Legal/Compliance** | Owns Terms, Privacy, Liability, Compliance rules, Playbooks |
| **Product** | Owns pilot simulation, supplier/buyer data, transaction flow |
| **QA** | Owns test execution, L3 verification, evidence collection |
| **Operations** | Owns manual playbooks, backup/restore tests, monitoring |

---

## Pre-Sprint Checklist

- [ ] Team roles assigned
- [ ] Sprint lead has authority to block pilot
- [ ] Legal counsel available for document review
- [ ] Compliance expert available for rule definition
- [ ] Test environment provisioned (clean VM/container)
- [ ] Backup system configured
- [ ] Monitoring tools installed (even if basic)
- [ ] Flutterwave test environment access
- [ ] Kenya→US coffee compliance sources identified
- [ ] 5 realistic supplier profiles prepared
- [ ] 5 realistic buyer profiles prepared

---

## Post-Sprint Checklist

- [ ] Sprint Evidence Log complete
- [ ] L3 Verification Report signed off
- [ ] Transaction evidence recorded
- [ ] Claim audit complete
- [ ] Risk register updated
- [ ] Pilot Decision Memo written
- [ ] If Pilot Approved: pilot launch plan created
- [ ] If Conditionally Approved: remediation plan created with 30-day timeline
- [ ] If Blocked: blocker analysis and replanning session scheduled

---

## Appendix: 15-Step Pilot Transaction

| Step | Action | Platform Module | Evidence Required |
|------|--------|-----------------|-------------------|
| 1 | Supplier registers | Auth + Organizations | Account created, verification status = pending |
| 2 | Supplier uploads documents | Documents + Verification | Documents stored, review status = pending |
| 3 | Supplier verified | Organizations | Status = verified, trust score assigned |
| 4 | Buyer registers | Auth + Organizations | Account created, verification status = pending |
| 5 | Buyer verified | Organizations | Status = verified |
| 6 | Supplier creates product | Products | Product listed with category, grade, certifications |
| 7 | Buyer creates RFQ | RFQs | RFQ published with requirements |
| 8 | Supplier submits quotation | RFQs + Quotations | Quotation received by buyer |
| 9 | Buyer counters | Quotations | Counteroffer tracked |
| 10 | Supplier accepts | Quotations + Deals | Deal created with milestones |
| 11 | Compliance checklist generated | Compliance | Checklist attached to deal |
| 12 | Documents reviewed | Documents | All docs approved |
| 13 | Inspection completed | Inspections | Results recorded, passed |
| 14 | Payment milestone triggered | Payments | Webhook received, status = completed |
| 15 | Deal completed | Deals | Status = completed, audit trail complete |

**Success criteria:** All 15 steps complete through UI/API. Zero database edits. Full audit trail.

---

*This sprint does not end until the transaction is real.*
