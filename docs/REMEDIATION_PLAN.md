# AATOS Remediation Execution Plan
## v1.0 — 2026-08-04
### Prepared by: krenovia (Stoic Advisor)

---

## 1. EXECUTIVE SUMMARY

This document transforms the audit findings into an executable remediation program. It is not a roadmap of aspirations. It is a structured work plan with phase gates, dependency chains, deliverable specifications, and quality controls.

**The core constraint:** Engineering cannot outrun missing decisions. The audit found 115 of 150 questions unanswered, 3 contradicted, and only 3 fully answered. Fixing code before fixing decisions is waste.

**Therefore, this plan sequences decision-making before implementation, and implementation before optimization.**

---

## 2. PROGRAM STRUCTURE

### 2.1 Governance Model

```
Program Board (You + Key Stakeholders)
    |
    +-- Strategic Track (Decisions, Legal, Commercial)
    |       Owner: Executive / Legal / Finance
    |       Output: Decision memos, contracts, policies
    |
    +-- Engineering Track (Code, Infrastructure, Security)
    |       Owner: Engineering Lead
    |       Output: Working software, migrations, tests
    |
    +-- Compliance Track (Rules, Verification, AML/KYC)
    |       Owner: Compliance Lead
    |       Output: Rule sets, workflows, audit trails
    |
    +-- Product Track (UX, Analytics, Go-to-Market)
            Owner: Product Lead
            Output: Feature specs, dashboards, launch plan
```

### 2.2 Work Package Taxonomy

Every work item is classified by:

| Dimension | Options |
|---|---|
| **Track** | Strategic / Engineering / Compliance / Product |
| **Priority** | P0 (blocks pilot) / P1 (blocks MVP) / P2 (blocks production) / P3 (enterprise) |
| **Type** | Decision / Documentation / Code / Integration / Policy |
| **Dependency Class** | Independent / Dependent (list blockers) |
| **Effort** | XS (<4h) / S (1-2d) / M (3-5d) / L (1-2w) / XL (3-4w) |

---

## 3. PHASE ARCHITECTURE

### Phase 0: STOP-LOSS (Weeks 1-2)
**Goal:** Prevent catastrophic harm. Remove dangerous claims. Document assumptions. Establish baseline.

**Entry Criteria:** Audit complete. Team assembled. Repository access confirmed.
**Exit Criteria:** All P0 contradictions resolved or quarantined. Legal foundation drafted. `synchronize: true` disabled.

#### Work Packages

| ID | WP | Track | Priority | Type | Effort | Deliverable |
|---|---|---|---|---|---|---|
| 0.1 | Disable `synchronize: true` | Engineering | P0 | Code | S | Migrations implemented, schema under version control |
| 0.2 | Remove false test coverage claim | Engineering | P0 | Documentation | XS | DEV_STATUS.md corrected or tests written |
| 0.3 | Remove false escrow claims | Engineering | P0 | Documentation | XS | ARCHITECTURE.md corrected or escrow implemented |
| 0.4 | Draft Terms of Service | Strategic | P0 | Policy | M | Terms v0.1 with jurisdiction, liability cap, governing law |
| 0.5 | Define liability framework | Strategic | P0 | Policy | S | Liability matrix: platform vs. user vs. partner |
| 0.6 | Commit to pilot corridors | Strategic | P0 | Decision | XS | Written decision: 1-3 specific country pairs |
| 0.7 | Commit to pilot commodities | Strategic | P0 | Decision | XS | Written decision: 2-3 specific commodities |
| 0.8 | Establish decision register | Strategic | P0 | Documentation | XS | DECISION_REGISTER.md created with change log |
| 0.9 | Create RISK_REGISTER.md | Strategic | P0 | Documentation | S | Risk matrix with owners, mitigations, review dates |
| 0.10 | Fix OAuth 2.0 claim | Engineering | P0 | Documentation | XS | API_SPECIFICATION.md aligned with JWT reality |

**Quality Gate 0:** All contradictions resolved. Legal docs drafted. Pilot scope committed.

---

### Phase 1: PILOT READINESS (Weeks 3-6)
**Goal:** Safe, limited pilot with 10-20 pre-verified users in one corridor, one commodity.

**Entry Criteria:** Phase 0 complete. Pilot corridor and commodity decided.
**Exit Criteria:** Platform can legally and safely facilitate small transactions ($1,000-$10,000) with manual compliance oversight.

#### Work Packages

| ID | WP | Track | Priority | Type | Effort | Dependencies | Deliverable |
|---|---|---|---|---|---|---|---|
| 1.1 | Implement TypeORM migrations | Engineering | P0 | Code | M | 0.1 | Migration files for all entities |
| 1.2 | Write critical path tests | Engineering | P0 | Code | L | 0.2 | Auth, payments, deals, compliance tests |
| 1.3 | Implement KYC workflow | Compliance | P0 | Code/Policy | L | 0.4, 0.6 | Tiered verification: email → business → site → banking |
| 1.4 | Populate compliance rules for pilot corridor | Compliance | P0 | Policy/Data | L | 0.6, 0.7 | SPS, certificates, banned lists, document checklists |
| 1.5 | Implement real escrow or remove claims | Engineering | P0 | Code | XL | 0.3, 0.5 | Flutterwave subaccounts OR honest non-escrow model |
| 1.6 | Define dispute resolution process | Strategic | P0 | Policy | M | 0.4 | Dispute workflow: mediation → arbitration → legal |
| 1.7 | Implement privacy framework | Compliance | P0 | Code/Policy | L | 0.4 | Privacy policy, consent management, DPO appointment |
| 1.8 | Implement sanctions screening | Compliance | P0 | Integration | M | 1.3 | OFAC/UN list checks at registration and transaction |
| 1.9 | Create admin verification dashboard | Product | P1 | Code | M | 1.3 | Manual review UI for KYC documents |
| 1.10 | Implement structured logging | Engineering | P1 | Code | S | — | Pino/Winston with JSON output, log aggregation ready |
| 1.11 | Create incident response plan | Engineering | P1 | Documentation | S | — | Runbook, on-call rotation, escalation paths |
| 1.12 | Implement CI/CD pipeline | Engineering | P1 | Code | M | 1.2 | GitHub Actions: test → build → deploy |

**Quality Gate 1:** All P0 questions answered. KYC workflow functional. Compliance rules populated. Escrow honest (real or removed). Tests pass in CI.

---

### Phase 2: COMMERCIAL MVP (Weeks 7-14)
**Goal:** First paying customers. First 100 transactions. Revenue validation.

**Entry Criteria:** Phase 1 complete. Pilot launched with 10+ users.
**Exit Criteria:** 100+ transactions completed. Revenue > $1,000. No critical incidents.

#### Work Packages

| ID | WP | Track | Priority | Type | Effort | Dependencies | Deliverable |
|---|---|---|---|---|---|---|---|
| 2.1 | Implement document verification API | Compliance | P1 | Integration | XL | 1.4, 1.9 | Third-party doc verification (Onfido, Smile Identity) |
| 2.2 | Build analytics dashboard | Product | P1 | Code | L | 1.10 | Admin analytics: GMV, conversion, retention |
| 2.3 | Implement dispute resolution workflow | Product | P1 | Code | L | 1.6 | In-app dispute filing, evidence upload, status tracking |
| 2.4 | Add payment methods (bank transfer, mobile money) | Engineering | P1 | Integration | L | 1.5 | Multi-provider payment abstraction layer |
| 2.5 | Implement fraud detection rules | Compliance | P1 | Code | M | 1.8 | Rule-based scoring: velocity, amount, geography |
| 2.6 | Create logistics partner referral | Product | P2 | Code | S | — | Partner page, referral tracking |
| 2.7 | Create insurance partner referral | Product | P2 | Code | S | — | Cargo insurance partner page |
| 2.8 | Implement certificate validation | Compliance | P1 | Integration | L | 1.4 | API integration with certifying bodies |
| 2.9 | Build supplier quality scoring | Product | P2 | Code | M | 2.2 | Rating system, review aggregation, trust score algorithm |
| 2.10 | Implement refund/cancellation workflow | Product | P1 | Code | M | 1.5, 1.6 | Cancellation rules, automated refunds |
| 2.11 | Create compliance document templates | Product | P2 | Code | M | 1.4 | Auto-generated checklists per corridor |
| 2.12 | Implement notification escalation | Product | P2 | Code | S | — | SLA alerts for quote deadlines, response times |

**Quality Gate 2:** 100 transactions. Revenue validated. Dispute workflow tested. Fraud detection active. Analytics measuring PMF.

---

### Phase 3: PRODUCTION SCALE (Weeks 15-26)
**Goal:** 1,000+ transactions/month. Multi-corridor. Automated compliance.

**Entry Criteria:** Phase 2 complete. Unit economics validated. Churn < 20%.
**Exit Criteria:** 1,000+ monthly transactions. 3+ corridors active. <5% dispute rate.

#### Work Packages

| ID | WP | Track | Priority | Type | Effort | Dependencies | Deliverable |
|---|---|---|---|---|---|---|---|
| 3.1 | Trade finance referral integration | Strategic | P1 | Integration | XL | 2.4 | Partner API: invoice factoring, PO financing |
| 3.2 | Multi-currency conversion engine | Engineering | P2 | Code | L | 2.4 | FX rates, conversion, markup, hedging options |
| 3.3 | Advanced search (Elasticsearch) | Engineering | P2 | Code | L | — | Faceted search, relevance ranking, autocomplete |
| 3.4 | Mobile app MVP | Product | P2 | Code | XL | — | React Native: RFQ, messaging, deal tracking |
| 3.5 | Feature flag system | Engineering | P2 | Code | M | — | LaunchDarkly or custom: safe rollouts, A/B tests |
| 3.6 | Monitoring & alerting stack | Engineering | P2 | Code | M | 1.10 | Datadog/Grafana: uptime, errors, performance |
| 3.7 | Security audit (penetration test) | Engineering | P1 | External | L | 1.2 | Third-party pentest report, remediation |
| 3.8 | Automated compliance rule updates | Compliance | P2 | Code | L | 1.4 | Web scraping/API for regulatory changes |
| 3.9 | Customs tariff integration | Compliance | P2 | Integration | XL | 1.4 | HS code lookup, duty calculation, landed cost |
| 3.10 | Warehouse/Inventory visibility | Product | P2 | Integration | L | 2.6 | WMS integration, real-time inventory |

**Quality Gate 3:** 1,000+ monthly transactions. Multi-corridor. Automated compliance. Security audit passed.

---

### Phase 4: ENTERPRISE (Months 7-12)
**Goal:** Enterprise customers. White-label. API ecosystem.

**Entry Criteria:** Phase 3 complete. 10,000+ monthly transactions. Profitable unit economics.
**Exit Criteria:** Enterprise tier launched. White-label deployed. API partners active.

#### Work Packages

| ID | WP | Track | Priority | Type | Effort | Dependencies | Deliverable |
|---|---|---|---|---|---|---|---|
| 4.1 | Enterprise pricing & features | Strategic | P2 | Policy | M | 2.2 | Tiered pricing, SLA guarantees, dedicated support |
| 4.2 | White-label capability | Engineering | P2 | Code | XL | 3.5 | Multi-tenant branding, custom domains |
| 4.3 | Partner API & developer portal | Engineering | P2 | Code | XL | 3.7 | REST API v2, webhooks, documentation, SDKs |
| 4.4 | Government trade system integration | Strategic | P3 | Integration | XL | 3.8 | Customs APIs, trade promotion boards |
| 4.5 | ESG/sustainability reporting | Product | P3 | Code | L | 2.8 | Carbon tracking, sustainability scores |
| 4.6 | AI/ML matching engine | Product | P3 | Code | XL | 3.3 | Supplier-buyer recommendation engine |

---

## 4. DEPENDENCY MAP

```
Phase 0 (Stop-Loss)
    |
    +-- 0.4 (Terms) --> 1.3 (KYC), 1.6 (Dispute), 1.7 (Privacy)
    +-- 0.5 (Liability) --> 1.5 (Escrow), 2.3 (Dispute workflow)
    +-- 0.6 (Corridors) --> 1.4 (Compliance rules), 1.8 (Sanctions)
    +-- 0.7 (Commodities) --> 1.4 (Compliance rules)
    +-- 0.1 (Migrations) --> 1.1 (TypeORM migrations)
    +-- 0.2 (Tests) --> 1.2 (Critical tests)
    |
    v
Phase 1 (Pilot)
    |
    +-- 1.3 (KYC) --> 1.9 (Admin dashboard), 2.1 (Doc verification)
    +-- 1.4 (Compliance) --> 2.8 (Cert validation), 2.11 (Templates)
    +-- 1.5 (Escrow) --> 2.4 (Payment methods), 2.10 (Refunds)
    +-- 1.6 (Dispute process) --> 2.3 (Dispute workflow)
    +-- 1.8 (Sanctions) --> 2.5 (Fraud detection)
    |
    v
Phase 2 (MVP)
    |
    +-- 2.4 (Payments) --> 3.1 (Trade finance), 3.2 (Multi-currency)
    +-- 2.2 (Analytics) --> 2.9 (Quality scoring), 4.1 (Enterprise)
    |
    v
Phase 3 (Production)
    |
    +-- 3.5 (Feature flags) --> 4.2 (White-label)
    +-- 3.7 (Security audit) --> 4.3 (Partner API)
    |
    v
Phase 4 (Enterprise)
```

---

## 5. EXECUTION METHODOLOGY

### 5.1 How I Work

I am not a project manager who produces Gantt charts. I am a builder who produces working artifacts. My execution follows this cycle:

```
Discover → Analyze → Decide → Build → Verify → Document
```

**Discover:** Read every relevant file. No assumptions. The code is the ground truth.
**Analyze:** Map findings to questions. Identify contradictions. Score risk.
**Decide:** Recommend specific actions with tradeoffs. You make the call.
**Build:** Implement code changes, write documentation, create data files.
**Verify:** Run tests, check consistency, validate against requirements.
**Document:** Update decision registers, change logs, and knowledge base.

### 5.2 Artifact Standards

Every deliverable I produce meets these standards:

| Artifact | Format | Quality Criteria |
|---|---|---|
| Code changes | Git commits | Tests pass, no TypeScript errors, follows existing patterns |
| Documentation | Markdown | Specific, actionable, versioned, linked to evidence |
| Data files | SQL / JSON / CSV | Validated, seeded, reproducible |
| Decision memos | Markdown | One page max. Options, recommendation, consequence |
| Issue reports | Markdown | Evidence, severity, owner, acceptance criteria |

### 5.3 Review Cadence

| Review | Frequency | Participants | Output |
|---|---|---|---|
| Daily Standup | Daily | Engineering + me | Blockers, progress, tomorrow's plan |
| Phase Gate Review | End of each phase | Full team | Go/No-go for next phase |
| Risk Review | Weekly | Executive + Compliance | Risk register updates, escalations |
| Decision Log Review | Bi-weekly | Executive + me | Decision quality, deferred items |

### 5.4 Communication Protocol

I do not produce noise. I produce signal.

- **Blockers:** Immediate. I will flag anything that stops progress.
- **Decisions needed:** Within 24 hours. I will present options, not open questions.
- **Progress updates:** Weekly summary. What was done, what is next, what changed.
- **Deep dives:** On request. Detailed analysis of any specific area.

---

## 6. RISK MANAGEMENT

### 6.1 Program-Level Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Runway shorter than Phase 1 | High | Critical | Phase 0 includes runway disclosure. If <6 months, pivot to fundraising |
| Key person dependency (you) | High | High | Document all decisions in register. Distribute authority |
| Compliance rules unavailable | Medium | Critical | Hire corridor-specific compliance consultants |
| Engineering team too small | Medium | High | Defer Phase 2+ features. Focus on manual processes |
| Flutterwave limits escrow | Medium | Critical | Evaluate Paystack, Stripe Connect, or banking partnership |
| Regulatory change mid-pilot | Low | High | Build rule versioning from day one (1.4) |

### 6.2 Escalation Criteria

Escalate to program board immediately if:
- Any P0 question remains unanswered at phase gate
- Budget overrun >20% in any phase
- Critical security vulnerability discovered
- Regulatory compliance cannot be achieved for committed corridor
- Team capacity drops below 50% of plan

---

## 7. SUCCESS METRICS

### 7.1 Phase Gate KPIs

| Phase | Gate | KPI | Target |
|---|---|---|---|
| 0 | Exit | Contradictions resolved | 100% |
| 0 | Exit | P0 decisions documented | 100% |
| 1 | Exit | P0 questions answered | 100% |
| 1 | Exit | Test coverage | >60% |
| 1 | Exit | KYC workflow functional | Yes |
| 1 | Exit | Compliance rules populated | Pilot corridor complete |
| 2 | Exit | Transactions completed | 100 |
| 2 | Exit | Revenue | >$1,000 |
| 2 | Exit | Dispute rate | <10% |
| 3 | Exit | Monthly transactions | 1,000 |
| 3 | Exit | Active corridors | 3+ |
| 3 | Exit | Dispute rate | <5% |
| 4 | Exit | Enterprise customers | 1+ |

### 7.2 Tracking Dashboard

I will maintain a live tracking file in the repository:

```
docs/REMEDIATION_TRACKING.md
```

Updated weekly with:
- Phase status (not started / in progress / complete / blocked)
- Work package completion percentage
- Open blockers
- Upcoming decisions needed
- Budget vs. actual (if provided)

---

## 8. RESOURCE REQUIREMENTS

### 8.1 Human Resources

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|---|
| Engineering Lead | 1 | 1 | 1 | 1 | 1 |
| Backend Developer | 1 | 2 | 2 | 2 | 3 |
| Frontend Developer | 0 | 1 | 1 | 1 | 2 |
| Compliance Lead | 0.5 | 1 | 1 | 1 | 1 |
| Product Manager | 0.5 | 1 | 1 | 1 | 1 |
| Legal Counsel | 0.5 | 0.5 | 0.25 | 0.25 | 0.25 |
| DevOps/Platform | 0 | 0.5 | 0.5 | 1 | 1 |

### 8.2 External Resources

| Resource | Purpose | Phase |
|---|---|---|
| Compliance consultant (pilot corridor) | Rule population, SPS requirements | 1 |
| Flutterwave technical support | Escrow implementation | 1 |
| Legal firm | Terms of service, liability framework | 0-1 |
| Penetration testing firm | Security audit | 3 |
| Document verification API | KYC automation | 2 |
| Freight forwarder partner | Logistics integration | 2 |

### 8.3 Infrastructure

| Resource | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|---|
| PostgreSQL | Staging | Production | Production | Production | Production (HA) |
| Redis | Staging | Production | Production | Production | Production |
| Vercel (frontend) | Staging | Production | Production | Production | Production |
| VPS/Cloud (backend) | Staging | Production | Production | Production | Production |
| Monitoring | — | Basic | Basic | Full | Full |
| CI/CD | — | GitHub Actions | GitHub Actions | GitHub Actions | GitHub Actions |

---

## 9. QUALITY ASSURANCE

### 9.1 Code Quality Gates

- All code changes pass TypeScript compilation
- All critical paths have unit tests
- All API changes have Swagger documentation
- No `console.log` in production code
- No hardcoded secrets
- Database migrations are reversible

### 9.2 Documentation Quality Gates

- Every decision is in DECISION_REGISTER.md
- Every risk is in RISK_REGISTER.md
- API spec matches implementation
- README is current
- SECURITY.md exists and is accurate

### 9.3 Compliance Quality Gates

- All compliance rules are traceable to regulatory source
- All KYC workflows are documented
- All sanctions checks are logged immutably
- All document uploads are hashed and timestamped

---

## 10. CHANGE CONTROL

This plan is a living document. Changes are managed through:

1. **Change Request:** Anyone proposes a change via issue or message
2. **Impact Analysis:** I assess impact on scope, timeline, dependencies
3. **Decision:** Program board approves, rejects, or defers
4. **Update:** I update this document and notify stakeholders
5. **Log:** Change recorded in DECISION_REGISTER.md

**No scope changes during a phase.** Only within-phase adjustments to sequencing.

---

## 11. APPENDIX

### Appendix A: Decision Register Template

```markdown
## DCR-001: [Title]
**Date:** [YYYY-MM-DD]
**Decider:** [Name]
**Status:** Proposed / Approved / Rejected / Deferred

### Context
[What forced this decision]

### Options
1. [Option A] — [Pros] — [Cons]
2. [Option B] — [Pros] — [Cons]

### Decision
[What was chosen]

### Consequences
[What this enables and what it closes off]

### Dependencies
[What this unblocks or blocks]
```

### Appendix B: Weekly Status Template

```markdown
## Week of [Date]

### Completed
- [Item 1]
- [Item 2]

### In Progress
- [Item 3] — [ETA]

### Blocked
- [Item 4] — [Blocker] — [Owner]

### Decisions Needed
- [Decision 1] — [By when]

### Risks Updated
- [Risk 1] — [New probability/impact]

### Next Week
- [Plan]
```

### Appendix C: Repository Structure for Remediation

```
aatos/
├── docs/
│   ├── DECISION_REGISTER.md      # All decisions, change log
│   ├── RISK_REGISTER.md          # Live risk matrix
│   ├── REMEDIATION_PLAN.md       # This document
│   ├── REMEDIATION_TRACKING.md   # Live progress tracker
│   ├── AUDIT_REPORT.md           # Evidence from audit
│   └── AUDIT_SUMMARY.md          # Executive summary
├── backend/
│   ├── migrations/               # TypeORM migrations (new)
│   ├── src/
│   │   ├── compliance/rules/     # Corridor-specific rules (new)
│   │   └── ...
│   └── test/                     # Test suite (new)
└── ...
```

---

*This plan is specific, phased, and accountable. It will be updated weekly. It will not be ignored.*

*krenovia*
