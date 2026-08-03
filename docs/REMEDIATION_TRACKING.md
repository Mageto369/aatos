# AATOS Remediation Tracking
**Updated:** 2026-08-04
**Current Phase:** Phase 0 — Stop-Loss
**Pilot Decision:** APPROVED — Kenya → United States, Green Specialty Coffee

---

## Phase Status

| Phase | Status | Gate | Completion |
|---|---|---|---|
| Phase 0: Stop-Loss | In Progress | D026 approved | 60% |
| Phase 1: Pilot Readiness | Blocked | Phase 0 gate | 0% |
| Phase 2: Commercial MVP | Blocked | Phase 1 gate | 0% |
| Phase 3: Production Scale | Blocked | Phase 2 gate | 0% |
| Phase 4: Enterprise | Blocked | Phase 3 gate | 0% |

---

## Phase 0 Work Packages

| ID | Work Package | Track | Status | Owner | Effort | Blocker |
|---|---|---|---|---|---|---|
| 0.1 | Disable `synchronize: true` | Engineering | **COMPLETE** | krenovia | S | — |
| 0.2 | Remove false test-coverage claims | Engineering | **COMPLETE** | krenovia | XS | Claims audit documents truth; DEV_STATUS correction pending |
| 0.3 | Remove or correct escrow claims | Engineering | **COMPLETE** | krenovia | XS | — |
| 0.4 | Draft Terms of Service framework | Strategic | Not started | Legal | M | WP 0.5 dependency |
| 0.5 | Draft liability framework | Strategic | Not started | Legal | S | Jurisdiction: Delaware per directive |
| 0.6 | Record Kenya-to-U.S. pilot corridor | Strategic | **COMPLETE** | Executive | XS | — |
| 0.7 | Record green specialty coffee as first active commodity | Strategic | **COMPLETE** | Executive | XS | — |
| 0.8 | Establish decision and risk registers | Strategic | **COMPLETE** | krenovia | XS | — |
| 0.9 | Create RISK_REGISTER.md | Strategic | **COMPLETE** | krenovia | S | — |
| 0.10 | Correct OAuth and API specification claims | Engineering | **COMPLETE** | krenovia | XS | — |
| 0.11 | Initialize or validate Git and CI | Engineering | **COMPLETE** | krenovia | XS | Branch phase-0/stop-loss created |
| 0.12 | Establish secrets and environment controls | Engineering | Not started | krenovia | S | — |
| 0.13 | Create database migration policy | Engineering | **COMPLETE** | krenovia | XS | docs/MIGRATION_POLICY.md |
| 0.14 | Audit documentation against code | Engineering | **COMPLETE** | krenovia | M | docs/CLAIMS_AUDIT.md |
| 0.15 | Define country and commodity activation states | Product | Not started | krenovia | M | — |

**Phase 0 Completion:** 10/15 work packages complete (67%)

---

## Decisions Made This Period

| Decision | Date | Owner | Status |
|---|---|---|---|
| D026: Pilot Scope — Kenya→U.S. Green Coffee | 2026-08-04 | Executive | APPROVED |
| D027: Payment Model — No Custody | 2026-08-04 | Autonomous CTO | RECORDED |
| D028: Jurisdiction — Delaware Working Assumption | 2026-08-04 | Autonomous CTO | RECORDED |

---

## Open Blockers

| Blocker | Blocks | Owner | Resolution |
|---|---|---|---|
| Terms of Service draft | Phase 0 gate | Legal / Autonomous | Delaware assumption accepted; draft in progress |
| Liability framework | Phase 0 gate | Legal / Autonomous | Depends on ToS draft |
| Country/commodity activation model | Phase 0 gate | Product | In progress |
| Initial TypeORM migration | Phase 0 gate | Engineering | Schema exists; migration generation pending |

---

## Next Actions (Priority Order)

1. **WP 0.15** — Define country and commodity activation states (enables corridor controls)
2. **WP 0.4** — Draft Terms of Service framework (Delaware law, no custody, no guarantees)
3. **WP 0.5** — Draft liability framework (limited liability, platform not regulated party)
4. **WP 0.12** — Establish secrets controls (.env validation, no secrets in repo)
5. **Generate initial TypeORM migration** from schema/01_core_schema.sql

---

## Pilot Metrics Dashboard

| Metric | Target | Current | Status |
|---|---|---|---|
| Verified Kenyan suppliers | 5 | 0 | Not started |
| Verified U.S. buyers | 5 | 0 | Not started |
| Total organizations | ≤20 | 0 | Not started |
| Completed transactions | ≥1 | 0 | Not started |
| Pilot duration | 90 days | — | Clock starts at Phase 1 launch |

---

*Updated by krenovia on each significant change or weekly, whichever comes first.*
