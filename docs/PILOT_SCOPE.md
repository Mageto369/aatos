# AATOS Pilot Scope

**Version:** 1.0
**Date:** 2026-08-05
**Status:** Enforced
**Authority:** AATOS 4-Week Trust and Pilot Readiness Directive

---

## Pilot Parameters

| Parameter | Value |
|---|---|
| **Corridor** | Kenya → United States |
| **Commodity** | Green specialty coffee (unroasted) |
| **Origin** | Kenya |
| **Destination** | United States |
| **Max suppliers** | 5 verified Kenyan suppliers |
| **Max buyers** | 5 verified U.S. buyers |
| **Max organizations** | 20 total |
| **Duration** | 90 days |
| **Success criterion** | At least one completed commercial transaction |

---

## What Is In Scope

- Supplier and buyer verification workflows
- Green coffee product listings with structured attributes
- RFQ creation and publication
- Quotation submission, counteroffer, revision, acceptance
- Deal conversion and contract generation
- Compliance checklist generation for Kenya → U.S. green coffee
- Document upload, review, approval, rejection
- Inspection request and result recording
- Payment milestone tracking
- Audit logging of all sensitive actions
- Real-time messaging between parties

---

## What Is Out of Scope

| Feature | Reason | Deferred To |
|---|---|---|
| Roasted coffee | Different regulatory path | Post-pilot |
| Instant coffee, extracts | Different HS codes, regulations | Post-pilot |
| Other corridors (Ghana, Nigeria, etc.) | Focus required for pilot | Phase 1 gate |
| Other commodities (cocoa, cashew, sesame) | Different compliance rules | Phase 1 gate |
| Trade finance | No licensed provider | Phase 2 |
| Insurance | No licensed provider | Phase 2 |
| Mobile app | Web-only for pilot | Phase 2 |
| AI matching | Basic search sufficient | Phase 2 |
| Government system integration | No live APIs | Phase 3 |
| White-label | Enterprise feature | Phase 4 |
| API partner program | Enterprise feature | Phase 4 |

---

## Activation States

The platform enforces pilot scope through activation states:

### Countries

| Country | Activation | Trade Enabled |
|---|---|---|
| Kenya (KE) | Active | Origin only |
| United States (US) | Active | Destination only |
| Ghana (GH) | Inactive | No |
| Nigeria (NG) | Inactive | No |
| Ethiopia (ET) | Inactive | No |
| Cote d'Ivoire (CI) | Inactive | No |
| All others | Inactive | No |

### Commodities

| Commodity | Activation | Trade Enabled |
|---|---|---|
| Green specialty coffee | Active | Yes |
| Cocoa | Inactive | No |
| Cashew | Inactive | No |
| Sesame | Inactive | No |
| All others | Inactive | No |

### Corridors

| Corridor | Activation | Trade Enabled |
|---|---|---|
| Kenya → United States | Active | Yes |
| All other corridors | Inactive | No |

---

## Enforcement Mechanism

The platform prevents out-of-scope activity by:

1. **Country validation** — Only Kenya and United States selectable for pilot
2. **Commodity validation** — Only green coffee category active
3. **Corridor validation** — RFQs require origin=Kenya, destination=United States
4. **Organization limit** — Hard cap at 20 organizations
5. **Admin override** — Platform administrators can approve exceptions with audit logging

---

## Decision Register Entry

| Field | Value |
|---|---|
| Decision ID | D033 |
| Title | Pilot Scope Enforcement — Kenya → U.S. Green Coffee |
| Date | 2026-08-05 |
| Decider | Autonomous execution (per directive) |
| Status | Enforced |

### Context
Scope creep destroys pilot focus. The directive mandates a single corridor, single commodity, limited participants.

### Decision
Pilot is strictly limited to Kenya → United States green specialty coffee. All other corridors and commodities are deactivated.

### Consequences
- Compliance rules only needed for one corridor
- Supplier/buyer recruitment is targeted
- Product schema is simplified
- Engineering focus is narrow

### Dependencies
- Unblocks: Compliance rule population, supplier recruitment targeting
- Requires: Country/commodity activation state implementation

---

*This scope is enforced in code and configuration. Changes require executive approval and pilot gate review.*
