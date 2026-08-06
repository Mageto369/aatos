# AATOS Corridor Readiness Checklist

**Version:** 1.0  
**Date:** 2026-08-06  
**Scope:** Process for adding new origin → destination commodity corridors to AATOS  
**Status:** Template — apply to each new corridor

---

## Overview

This checklist ensures every new trade corridor added to AATOS is verified, documented, and seeded with the same rigor as the Kenya → United States green coffee pilot corridor.

**Principle:** No corridor goes live without documented compliance rules, verified sources, and a pass/fail report.

---

## Phase 0: Corridor Selection (Pre-Work)

### 0.1 Business Case
- [ ] Corridor identified by executive team or market research
- [ ] Target commodity specified (HS code level)
- [ ] Estimated annual trade volume documented
- [ ] Target supplier count defined (max 5 for pilot)
- [ ] Target buyer count defined (max 5 for pilot)
- [ ] Revenue model validated for corridor

### 0.2 Feasibility Screen
- [ ] Origin country has functioning agricultural/export authority
- [ ] Destination country has clear import regulations for commodity
- [ ] No active sanctions blocking trade (OFAC/EU/UN check)
- [ ] Payment infrastructure exists (at least one viable payment method)
- [ ] Logistics infrastructure exists (at least one freight forwarder serves route)

### 0.3 Gate Decision
- [ ] Business case approved by executive
- [ ] Feasibility screen passed
- [ ] **Gate:** Proceed to Phase 1

---

## Phase 1: Regulatory Research (1–2 weeks)

### 1.1 Origin Country Requirements

For each applicable authority:
- [ ] Identify export licensing authority
- [ ] Identify phytosanitary/quarantine authority (if agricultural)
- [ ] Identify standards/quality authority
- [ ] Identify revenue/customs authority
- [ ] Document required export permits/licenses
- [ ] Document required inspections
- [ ] Document required certifications
- [ ] Document required export declarations
- [ ] Verify fees and timelines from primary sources
- [ ] Record source URLs and verification dates

### 1.2 Destination Country Requirements

For each applicable authority:
- [ ] Identify food/agricultural safety authority (e.g., FDA, EFSA)
- [ ] Identify plant/animal quarantine authority (e.g., USDA APHIS)
- [ ] Identify customs/tariff authority (e.g., CBP, EU TARIC)
- [ ] Identify prior notice/advance declaration requirements
- [ ] Identify importer registration requirements
- [ ] Identify laboratory testing requirements
- [ ] Document tariff classification (HS code)
- [ ] Verify duty rates and preferential trade agreements
- [ ] Document state/provincial-level requirements (if applicable)
- [ ] Verify fees and timelines from primary sources
- [ ] Record source URLs and verification dates

### 1.3 Commercial Documentation
- [ ] Commercial invoice requirements documented
- [ ] Packing list requirements documented
- [ ] Transport document (B/L, AWB) requirements documented
- [ ] Insurance requirements documented
- [ ] Certificate of Analysis requirements documented (if applicable)
- [ ] Origin certificate requirements documented

### 1.4 Source Verification
- [ ] All rules have primary source attribution (government website)
- [ ] All source URLs verified accessible (not 404)
- [ ] All fees cross-referenced with at least 2 sources
- [ ] All timelines cross-referenced with industry practice
- [ ] **Gate:** All sources verified against primary regulatory websites

---

## Phase 2: Rule Set Construction (3–5 days)

### 2.1 Create Compliance Source Matrix
- [ ] Create `docs/COMPLIANCE_SOURCE_MATRIX_{ORIGIN}_{DESTINATION}_{COMMODITY}.md`
- [ ] Include regulatory framework overview
- [ ] Include all verified rules with full attribution
- [ ] Include verification status table
- [ ] Include discrepancies and caveats section
- [ ] Include maintenance schedule

### 2.2 Create Seed Data
- [ ] Create `backend/src/compliance/seeds/{origin}-{destination}-{commodity}.rules.ts`
- [ ] Map all rules to `ComplianceRuleSeed` interface
- [ ] Include rule summary export
- [ ] Validate all required fields populated
- [ ] Validate country codes (ISO 3166-1 alpha-2)

### 2.3 Create Seeder Script
- [ ] Create `backend/src/compliance/seeds/seed-{origin}-{destination}-{commodity}.ts`
- [ ] Support replace/skip/append modes
- [ ] Include confirmation prompt for destructive operations
- [ ] Include summary output

### 2.4 Create Validation Script
- [ ] Create `backend/src/compliance/seeds/validate-{origin}-{destination}-{commodity}.ts`
- [ ] Validate required fields populated
- [ ] Validate source attribution
- [ ] Validate URL format
- [ ] Validate cost estimates (where applicable)
- [ ] Validate timeline estimates
- [ ] Validate responsible party values
- [ ] Validate description length
- [ ] Exit with code 1 on failures

### 2.5 Create Integration Test
- [ ] Create `backend/src/compliance/seeds/integration-test-{origin}-{destination}-{commodity}.ts`
- [ ] Test checklist generation for exporter entity
- [ ] Test checklist generation for importer entity
- [ ] Verify correct task segmentation by party
- [ ] Simulate task completion and verify completion tracking
- [ ] Verify source URLs accessible

---

## Phase 3: Validation & Sign-Off (2–3 days)

### 3.1 Execute Validation
- [ ] Run validation script: `npx ts-node validate-{corridor}.ts`
- [ ] Achieve 100% pass rate (0 failures)
- [ ] Review and resolve all warnings

### 3.2 Execute Integration Test
- [ ] Run integration test: `npx ts-node integration-test-{corridor}.ts`
- [ ] Verify checklist generates correctly
- [ ] Verify completion tracking works
- [ ] Verify source traceability maintained

### 3.3 Create Pass/Fail Report
- [ ] Create `docs/COMPLIANCE_PASS_FAIL_REPORT_{ORIGIN}_{DESTINATION}.md`
- [ ] Document total rules validated
- [ ] Document pass/warn/fail counts
- [ ] Document source verification table
- [ ] Document critical path validation
- [ ] Document identified gaps (non-blockers)
- [ ] Include recommendations
- [ ] Include sign-off table

### 3.4 Legal Review
- [ ] Submit source matrix to legal counsel
- [ ] Counsel reviews for accuracy and completeness
- [ ] Counsel flags any regulatory changes or missed requirements
- [ ] Updates applied based on counsel feedback
- [ ] **Gate:** Legal counsel sign-off obtained

### 3.5 Seed Database
- [ ] Execute seeder in staging environment
- [ ] Verify rules appear in database
- [ ] Verify checklist generation works in staging
- [ ] **Gate:** Staging validation passed

---

## Phase 4: Documentation & Handoff (1–2 days)

### 4.1 Update Tracking
- [ ] Update `docs/REMEDIATION_TRACKING.md` with new corridor
- [ ] Record decision in decision log
- [ ] Update compliance module documentation

### 4.2 Create Runbook
- [ ] Document exact commands to seed corridor
- [ ] Document exact commands to validate corridor
- [ ] Document exact commands to test corridor
- [ ] Include troubleshooting section

### 4.3 Notify Stakeholders
- [ ] Notify engineering team corridor is ready
- [ ] Notify compliance team source matrix is available
- [ ] Notify product team checklist generation works
- [ ] Update executive dashboard

---

## Quality Gates

| Gate | Criteria | Owner |
|------|----------|-------|
| **G0: Selection** | Business case + feasibility approved | Executive |
| **G1: Research** | All rules verified against primary sources | Compliance Researcher |
| **G2: Construction** | Seed data, seeder, validator, test all created | Engineer |
| **G3: Validation** | 100% pass rate on validation script | QA / Automation |
| **G4: Legal** | Counsel sign-off on source matrix | Legal |
| **G5: Staging** | Rules seeded and checklist generation verified | DevOps |
| **G6: Handoff** | Documentation complete, stakeholders notified | Product Manager |

---

## Corridor-Specific Notes

### Kenya → United States (Green Coffee)
- **Completed:** 2026-08-06
- **Rules:** 16
- **Pass Rate:** 100%
- **Legal Review:** Pending
- **Database Seeded:** No (awaiting environment)

### Next Corridor Candidates
_(Populate after pilot launch)_

| Corridor | Commodity | Priority | Notes |
|----------|-----------|----------|-------|
| | | | |

---

## Time Estimates

| Phase | Duration | Parallelizable |
|-------|----------|----------------|
| Phase 0: Selection | 1–3 days | No |
| Phase 1: Research | 1–2 weeks | Yes (origin + destination in parallel) |
| Phase 2: Construction | 3–5 days | No |
| Phase 3: Validation | 2–3 days | Partial |
| Phase 4: Documentation | 1–2 days | No |
| **Total** | **3–5 weeks** | |

---

## Appendix: Required Artifacts Per Corridor

```
docs/
  COMPLIANCE_SOURCE_MATRIX_{ORIGIN}_{DESTINATION}_{COMMODITY}.md
  COMPLIANCE_PASS_FAIL_REPORT_{ORIGIN}_{DESTINATION}.md

backend/src/compliance/seeds/
  {origin}-{destination}-{commodity}.rules.ts
  seed-{origin}-{destination}-{commodity}.ts
  validate-{origin}-{destination}-{commodity}.ts
  integration-test-{origin}-{destination}-{commodity}.ts
```

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-06 | krenovia | Initial template based on KE→US green coffee corridor |

---

*This checklist ensures systematic, repeatable corridor addition to AATOS. Do not skip phases. Do not deploy without G5 (staging validation) and G4 (legal review) complete.*
