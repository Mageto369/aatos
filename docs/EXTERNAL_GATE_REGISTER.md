# External Gate Register

**Project:** AATOS Pilot Launch  
**Date:** 2026-08-06  
**Status:** PILOT CONDITIONALLY APPROVED

---

## Gate 1: Legal Review

| Field | Value |
|-------|-------|
| **Owner** | External legal counsel (to be engaged) |
| **Required Evidence** | Signed legal opinion on compliance rules liability, terms of service review, privacy policy adequacy |
| **Target Date** | TBD |
| **Impact** | Blocks transition from PILOT CONDITIONALLY APPROVED to PILOT APPROVED |
| **Temporary Mitigation** | Limit pilot to sandbox transactions only; no real money movement; manual legal review of each corridor |
| **Gate Affected** | Pilot launch, compliance accuracy, liability protection |

---

## Gate 2: Customs Broker Review

| Field | Value |
|-------|-------|
| **Owner** | Licensed customs broker (to be engaged) |
| **Required Evidence** | Verified compliance rule accuracy for Kenya→US green coffee; confirmation of document requirements; HTS classification validation |
| **Target Date** | TBD |
| **Impact** | Blocks live customs documentation generation; may result in incorrect compliance checklists |
| **Temporary Mitigation** | Manual compliance checklist review for each pilot shipment; direct broker involvement in first 10 transactions |
| **Gate Affected** | Compliance automation, corridor expansion, regulatory risk |

---

## Gate 3: External Penetration Test

| Field | Value |
|-------|-------|
| **Owner** | Third-party security firm (to be engaged) |
| **Required Evidence** | Penetration test report with no critical findings; remediation of high findings; retest confirmation |
| **Target Date** | TBD |
| **Impact** | Blocks production deployment; may reveal authentication/authorization vulnerabilities |
| **Temporary Mitigation** | Limit pilot to staging environment; restrict sensitive data; enable comprehensive audit logging |
| **Gate Affected** | Security baseline, production readiness, data protection |

---

## Gate 4: Payment Provider Approval

| Field | Value |
|-------|-------|
| **Owner** | Stripe / MangoPay / Alternative provider |
| **Required Evidence** | Approved merchant account; compliance with provider terms; escrow capability verification |
| **Target Date** | TBD |
| **Impact** | Blocks live payment processing; pilot limited to mock/sandbox payments |
| **Temporary Mitigation** | Use sandbox environment for all pilot payments; manual bank transfer coordination for live transactions |
| **Gate Affected** | Revenue generation, payment automation, financial compliance |

---

## Gate 5: Production Credentials & Infrastructure

| Field | Value |
|-------|-------|
| **Owner** | DevOps / Infrastructure team |
| **Required Evidence** | Production database provisioned; SSL certificates; environment variables configured; backup strategy; monitoring |
| **Target Date** | TBD |
| **Impact** | Blocks production deployment |
| **Temporary Mitigation** | Use staging environment for pilot; document production deployment playbook |
| **Gate Affected** | Deployment, reliability, disaster recovery |

---

## Gate 6: Git Remote Authentication

| Field | Value |
|-------|-------|
| **Owner** | Engineering lead |
| **Required Evidence** | Protected branch rules; required PR reviews; CI/CD pipeline; secret scanning |
| **Target Date** | TBD |
| **Impact** | Code integrity risk |
| **Temporary Mitigation** | Manual code review for all changes; no direct pushes to main branch |
| **Gate Affected** | Code quality, security, audit trail |

---

## Summary

| Gate | Status | Blocking Pilot? |
|------|--------|-----------------|
| Legal Review | Not started | Yes (conditionally) |
| Customs Broker | Not started | Yes (conditionally) |
| Penetration Test | Not started | Yes (conditionally) |
| Payment Provider | Not started | No (sandbox OK) |
| Production Infra | Not started | No (staging OK) |
| Git Security | Not started | No (manual process) |

**Recommendation:** Proceed with limited pilot under strict conditions. Engage external reviewers immediately.
