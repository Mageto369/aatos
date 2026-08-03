# AATOS Repository Audit Report

**Audit Date:** 2026-08-04
**Auditor:** krenovia (Stoic Advisor)
**Repository:** https://github.com/Mageto369/aatos
**Scope:** Full codebase + documentation vs. MASTER_QUESTIONER.md (150 questions)
**Method:** Evidence-only. No assumptions. No invented answers.

---

## I. ORIGIN STRATEGY — Supplier Acquisition & Verification

### Q1: How many verified suppliers are required for launch per corridor?
**Status:** Not Answered
**Evidence:** None found in any file.
**Confidence:** High
**Reasoning:** No target numbers exist in README, DEV_STATUS, ARCHITECTURE, or any source file. The `Organization` entity supports `verification_level` enum (`none` through `banking_verified`) but no launch thresholds are documented.
**Risk Level:** Critical
**Business Impact:** Cannot plan launch readiness without supplier targets.
**Engineering Impact:** None — infrastructure exists but targets are undefined.
**Recommended Decision:** Executive must set minimum viable supplier count per corridor before pilot.
**Owner:** Executive / Product
**Dependencies:** Q2 (corridor definitions)

---

### Q2: Which corridors (country pairs) will be active at pilot launch?
**Status:** Partially Answered
**Evidence:**
- `backend/src/compliance/compliance.service.ts:47` — rules query by `originCountry` and `destinationCountry`
- `schema/01_core_schema.sql` — `compliance_rules` table has `origin_country`, `destination_country` fields
- No explicit corridor list found in any configuration or documentation
**Confidence:** Medium
**Reasoning:** The data model supports arbitrary corridors via compliance rules, but no specific corridor list is committed anywhere. `DEV_STATUS.md` mentions "global agricultural trade" but names no specific countries.
**Risk Level:** Critical
**Business Impact:** Cannot build compliance rule sets, localize UI, or target marketing without corridor definitions.
**Engineering Impact:** Database schema is generic enough to support any corridor.
**Recommended Decision:** Executive must commit to 1-3 pilot corridors.
**Owner:** Executive / Product
**Dependencies:** Q1, Q12

---

### Q3: What is the supplier onboarding funnel conversion target?
**Status:** Not Answered
**Evidence:** None found.
**Confidence:** High
**Reasoning:** No KPIs, no funnel metrics, no conversion targets in any file.
**Risk Level:** High
**Business Impact:** Cannot measure onboarding success or identify drop-off points.
**Engineering Impact:** No instrumentation for funnel tracking exists.
**Recommended Decision:** Product must define funnel stages and conversion targets.
**Owner:** Product / Marketing

---

### Q4: What is the target cost per supplier acquisition?
**Status:** Not Answered
**Evidence:** None found.
**Confidence:** High
**Reasoning:** No CAC targets, no marketing budget allocations, no acquisition channels defined.
**Risk Level:** Medium
**Business Impact:** Cannot budget or evaluate channel efficiency.
**Engineering Impact:** None.
**Recommended Decision:** Finance must set acquisition budget and CAC targets.
**Owner:** Finance / Marketing

---

### Q5: What verification evidence is required per tier?
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `verification_level` enum: `none`, `email_phone`, `business_registration`, `physical_site`, `banking_verified`
- `backend/src/organizations/organizations.service.ts:32` — `verificationLevel: 'none'` on creation
- No documentation mapping verification tiers to required evidence documents
**Confidence:** Medium
**Reasoning:** The enum exists but the requirements per level are not documented or enforced in code. The `ComplianceChecklistItem` entity (`compliance-checklist-item.entity.ts`) supports evidence but no mapping exists.
**Risk Level:** High
**Business Impact:** Cannot verify suppliers consistently. Trust model is undefined.
**Engineering Impact:** Schema supports tiers but no enforcement logic exists.
**Recommended Decision:** Compliance must define evidence requirements per tier. Engineering must implement validation.
**Owner:** Compliance / Engineering

---

### Q6: Who verifies supplier documents? Manual or automated?
**Status:** Not Answered
**Evidence:** None found. No verification workflow in backend.
**Confidence:** High
**Reasoning:** The `Organization` entity has `status` enum (`draft` through `verified`) but no transition logic exists in any service. No admin verification workflow, no third-party integration for verification.
**Risk Level:** Critical
**Business Impact:** Trust mechanism is unimplemented. Platform cannot guarantee supplier legitimacy.
**Engineering Impact:** Major gap — no verification service exists.
**Recommended Decision:** Decide between manual review, API integration (e.g., Onfido, Smile Identity), or hybrid. Build verification workflow.
**Owner:** Compliance / Engineering

---

### Q7: What is the penalty or recourse if a supplier ships substandard product?
**Status:** Not Answered
**Evidence:** None found. No penalty framework in deals, payments, or compliance modules.
**Confidence:** High
**Reasoning:** The `Deal` entity has `status` and `milestones` but no dispute resolution or penalty logic. `Payment` has escrow-like states but no penalty release conditions.
**Risk Level:** Critical
**Business Impact:** Buyer protection is undefined. Platform liability is unbounded.
**Engineering Impact:** None yet — need business rules first.
**Recommended Decision:** Legal must define supplier recourse terms. Engineering must implement dispute workflow.
**Owner:** Legal / Product

---

### Q8: How are supplier quality scores calculated?
**Status:** Not Answered
**Evidence:** `schema/01_core_schema.sql` — `trust_score` field on organizations (default 50.0) but no calculation logic.
**Confidence:** High
**Reasoning:** `trust_score` exists in schema and entity but is never updated by any service. No rating system, no review mechanism, no quality metric aggregation.
**Risk Level:** High
**Business Impact:** Cannot rank or filter suppliers by quality.
**Engineering Impact:** Needs rating/review module and scoring algorithm.
**Recommended Decision:** Product must define scoring formula. Engineering must build rating system.
**Owner:** Product / Engineering

---

### Q9: What happens to a supplier's active deals if suspended?
**Status:** Not Answered
**Evidence:** No suspension logic in `organizations.service.ts`. Soft delete exists but no suspension cascade.
**Confidence:** High
**Reasoning:** `Organization.status` enum includes `suspended` but no code handles this transition or its effects on active deals, payments, or RFQs.
**Risk Level:** Critical
**Business Impact:** Active deals could continue with suspended suppliers. Financial exposure.
**Engineering Impact:** Need cascade logic and business rules.
**Recommended Decision:** Legal/Product must define suspension policy. Engineering must implement cascade.
**Owner:** Legal / Engineering

---

### Q10: What is the maximum geographic radius for supplier matching?
**Status:** Not Answered
**Evidence:** None found. No geographic matching logic exists.
**Confidence:** High
**Reasoning:** Products have `origin_country` but no radius-based search. No coordinate fields, no distance calculation.
**Risk Level:** Medium
**Business Impact:** Matching is limited to country-level granularity.
**Engineering Impact:** Would require geospatial indexing.
**Recommended Decision:** Product must decide if geographic radius matching is needed for pilot.
**Owner:** Product

---

### Q11: Are cooperatives treated as single suppliers or collections?
**Status:** Not Answered
**Evidence:** `schema/01_core_schema.sql` — `org_type` enum includes `cooperative` but no special handling.
**Confidence:** High
**Reasoning:** Cooperative is just one org_type value. No parent-child relationship, no member aggregation logic.
**Risk Level:** Medium
**Business Impact:** Cooperative members cannot be represented individually or collectively.
**Engineering Impact:** Would need hierarchical organization model.
**Recommended Decision:** Product must define cooperative model. Engineering must implement if required.
**Owner:** Product / Engineering

---

### Q12: What commodities are prioritized for the pilot?
**Status:** Partially Answered
**Evidence:**
- `backend/src/products/entities/product-category.entity.ts` — categories exist but no prioritized list
- `DEV_STATUS.md` — mentions "cocoa, coffee, cashew, sesame" in demo data
**Confidence:** Medium
**Reasoning:** DEV_STATUS mentions commodities in passing but no explicit prioritization document exists.
**Risk Level:** High
**Business Impact:** Cannot focus supplier acquisition or compliance rule building.
**Engineering Impact:** Generic category system supports any commodity.
**Recommended Decision:** Executive must commit to 2-3 pilot commodities.
**Owner:** Executive / Product

---

### Q13: How are seasonal supply fluctuations handled in matching?
**Status:** Not Answered
**Evidence:** None found. No seasonality logic in products or deals.
**Confidence:** High
**Reasoning:** `Product` entity has `available_from` and `available_until` fields but no matching logic uses them.
**Risk Level:** Medium
**Business Impact:** Buyers may match with unavailable suppliers.
**Engineering Impact:** Would need availability window filtering.
**Recommended Decision:** Product must decide if seasonality is pilot-critical.
**Owner:** Product

---

### Q14: What is the unit economics of supplier onboarding?
**Status:** Not Answered
**Evidence:** None found. No cost model, no onboarding time estimates.
**Confidence:** High
**Reasoning:** No financial model for onboarding exists. Platform fee is 1% (`deals.service.ts:20`) but onboarding cost is undefined.
**Risk Level:** Medium
**Business Impact:** Cannot determine if onboarding is profitable.
**Engineering Impact:** None.
**Recommended Decision:** Finance must model onboarding unit economics.
**Owner:** Finance

---

### Q15: What is the target supplier retention rate at 6 months?
**Status:** Not Answered
**Evidence:** None found. No retention metrics, no cohort tracking.
**Confidence:** High
**Reasoning:** No analytics for supplier retention. No engagement scoring.
**Risk Level:** Medium
**Business Impact:** Cannot measure platform health for supply side.
**Engineering Impact:** Would need analytics pipeline.
**Recommended Decision:** Product must set retention targets. Engineering must implement tracking.
**Owner:** Product / Engineering

---

### Q16: How are supplier certifications validated (organic, Fairtrade, etc.)?
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `certifications` array on products
- `backend/src/products/products.service.ts:57` — filter by certification
- No validation logic, no certifying body integration
**Confidence:** High
**Reasoning:** Certifications can be stored and filtered but there is no validation against certifying bodies.
**Risk Level:** High
**Business Impact:** False certifications damage trust and create liability.
**Engineering Impact:** Would need third-party API integrations or manual verification workflow.
**Recommended Decision:** Compliance must define validation method. Engineering must implement.
**Owner:** Compliance / Engineering

---

### Q17: What is the maximum acceptable lead time from inquiry to quote?
**Status:** Not Answered
**Evidence:** None found. No SLA definitions.
**Confidence:** High
**Reasoning:** RFQ has `quote_deadline` but no platform-wide SLA. No escalation for late quotes.
**Risk Level:** Medium
**Business Impact:** Buyer experience degrades without response time guarantees.
**Engineering Impact:** Would need notification escalation system.
**Recommended Decision:** Product must define response SLA.
**Owner:** Product

---

### Q18: Are there exclusive supplier arrangements or is it open marketplace?
**Status:** Not Answered
**Evidence:** None found. No exclusivity flags, no marketplace mode configuration.
**Confidence:** High
**Reasoning:** No business model documented for supplier exclusivity vs. open marketplace.
**Risk Level:** High
**Business Impact:** Affects supplier acquisition strategy and competitive positioning.
**Engineering Impact:** None yet — need business decision first.
**Recommended Decision:** Executive must decide marketplace model.
**Owner:** Executive

---

### Q19: What happens to supplier data if they leave the platform?
**Status:** Not Answered
**Evidence:** Soft delete exists but no data retention policy.
**Confidence:** High
**Reasoning:** `Organization` has `deletedAt` (soft delete) but no GDPR/privacy retention logic. No data export feature.
**Risk Level:** Medium
**Business Impact:** Regulatory risk (GDPR, POPIA). User trust issue.
**Engineering Impact:** Need data retention policies and export features.
**Recommended Decision:** Legal must define data retention and deletion policy.
**Owner:** Legal / Compliance

---

## II. BUYER DYNAMICS — Demand Side & Trust

### Q20: What buyer segments are prioritized? (processors, retailers, importers)
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `org_type` enum includes `processor`, `manufacturer`, `exporter`, `trader`, `importer`, `distributor`, `retailer`
- No prioritization or segment strategy documented
**Confidence:** High
**Reasoning:** All buyer types can register but no priority order or segment-specific features exist.
**Risk Level:** High
**Business Impact:** Cannot tailor UX, pricing, or features to high-value segments.
**Engineering Impact:** Generic org model supports all types.
**Recommended Decision:** Product must define target buyer segments for pilot.
**Owner:** Product / Executive

---

### Q21: What is the target buyer acquisition cost?
**Status:** Not Answered
**Evidence:** None found.
**Confidence:** High
**Reasoning:** No CAC targets, no acquisition channels defined for buyers.
**Risk Level:** Medium
**Business Impact:** Cannot budget or evaluate buyer acquisition efficiency.
**Engineering Impact:** None.
**Recommended Decision:** Finance must set buyer acquisition budget and targets.
**Owner:** Finance / Marketing

---

### Q22: How is buyer creditworthiness assessed before trade finance?
**Status:** Not Answered
**Evidence:** None found. No credit scoring, no trade finance module exists.
**Confidence:** High
**Reasoning:** `org_type` includes `bank` and `trade_finance` but no trade finance functionality is implemented. No credit check integration.
**Risk Level:** Critical
**Business Impact:** Cannot offer trade finance. Major revenue stream blocked.
**Engineering Impact:** Major feature gap.
**Recommended Decision:** Executive must decide if trade finance is pilot scope. If yes, partner with financial institution.
**Owner:** Executive / Finance

---

### Q23: What payment terms are supported? (LC, advance, open account)
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `milestone_type` enum includes `advance_payment`, `main_payment`
- `backend/src/payments/payments.service.ts` — Flutterwave integration only
- No letter of credit, no open account, no trade finance instruments
**Confidence:** High
**Reasoning:** Only Flutterwave card/bank payments are implemented. No LC, no documentary collection, no trade finance.
**Risk Level:** Critical
**Business Impact:** International trade typically requires LC or similar. Without these, platform is limited to small/domestic trades.
**Engineering Impact:** Major gap — need integrations with trade finance providers.
**Recommended Decision:** Executive must decide payment terms for pilot. Engineering must integrate if LC is required.
**Owner:** Executive / Engineering

---

### Q24: What is the minimum order value to justify platform use?
**Status:** Not Answered
**Evidence:** None found. No minimum order validation.
**Confidence:** High
**Reasoning:** Deals can be created with any value. No business rules for minimums.
**Risk Level:** Medium
**Business Impact:** Platform may process unprofitable small orders.
**Engineering Impact:** Would need configurable minimum order logic.
**Recommended Decision:** Product must define minimum viable deal size.
**Owner:** Product / Finance

---

### Q25: How are buyer complaints handled and tracked?
**Status:** Not Answered
**Evidence:** No complaint entity, no dispute service, no ticket system.
**Confidence:** High
**Reasoning:** No dispute resolution workflow exists anywhere in the codebase.
**Risk Level:** Critical
**Business Impact:** Buyer protection is nonexistent. Chargeback and liability risk.
**Engineering Impact:** Major feature needed.
**Recommended Decision:** Product must define complaint workflow. Engineering must build dispute/ticket system.
**Owner:** Product / Engineering

---

### Q26: What is the dispute resolution process?
**Status:** Not Answered
**Evidence:** None found. No dispute entity or service.
**Confidence:** High
**Reasoning:** No arbitration workflow, no mediation steps, no automated resolution.
**Risk Level:** Critical
**Business Impact:** Parties have no recourse for failed trades.
**Engineering Impact:** Major feature gap.
**Recommended Decision:** Legal must define dispute resolution process. Engineering must implement.
**Owner:** Legal / Product

---

### Q27: Are there buyer verification tiers equivalent to suppliers?
**Status:** Not Answered
**Evidence:** `verification_level` exists on organizations but no buyer-specific tiers.
**Confidence:** High
**Reasoning:** Same field used for all org types. No buyer-specific verification requirements.
**Risk Level:** Medium
**Business Impact:** Cannot assess buyer credibility for suppliers.
**Engineering Impact:** Would need tier definitions per org type.
**Recommended Decision:** Compliance must define if buyers need equivalent verification.
**Owner:** Compliance / Product

---

### Q28: What is the target buyer-to-supplier ratio per corridor?
**Status:** Not Answered
**Evidence:** None found.
**Confidence:** High
**Reasoning:** No marketplace liquidity targets defined.
**Risk Level:** High
**Business Impact:** Cannot assess marketplace health or balance supply/demand.
**Engineering Impact:** None.
**Recommended Decision:** Product must define liquidity targets per corridor.
**Owner:** Product

---

### Q29: How are repeat buyers incentivized?
**Status:** Not Answered
**Evidence:** No loyalty program, no discount logic, no incentive system.
**Confidence:** High
**Reasoning:** No evidence of any buyer incentive mechanism.
**Risk Level:** Medium
**Business Impact:** No mechanism to increase LTV or reduce churn.
**Engineering Impact:** Would need loyalty/rewards system.
**Recommended Decision:** Product must define incentive strategy.
**Owner:** Product

---

### Q30: What is the platform's liability if a buyer does not pay?
**Status:** Not Answered
**Evidence:** No terms of service, no liability framework.
**Confidence:** High
**Reasoning:** No legal documents in repository. No escrow release conditions for non-payment.
**Risk Level:** Critical
**Business Impact:** Platform liability is undefined. Supplier protection is absent.
**Engineering Impact:** None yet — need legal framework first.
**Recommended Decision:** Legal must define platform liability and payment guarantee terms.
**Owner:** Legal

---

### Q31: How are buyer procurement preferences stored and matched?
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `rfqs` table stores buyer requirements
- `backend/src/rfqs/rfqs.service.ts` — RFQ creation and matching
- No preference profile, no automated matching algorithm
**Confidence:** High
**Reasoning:** Buyers can create RFQs but there is no persistent preference profile or proactive matching.
**Risk Level:** Medium
**Business Impact:** Buyers must actively create RFQs. No push notifications for matching products.
**Engineering Impact:** Would need preference matching engine.
**Recommended Decision:** Product must decide if automated matching is pilot scope.
**Owner:** Product / Engineering

---

### Q32: What currencies are supported for buyer quotations?
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `currency` fields exist on deals, payments, quotations
- `backend/src/payments/flutterwave.service.ts` — Supports any currency Flutterwave supports
- No explicit supported-currency list
**Confidence:** Medium
**Reasoning:** Currency is stored as string. Flutterwave supports many currencies but no platform-level restriction exists.
**Risk Level:** Low
**Business Impact:** May support currencies that create compliance issues.
**Engineering Impact:** Would need allowed-currency configuration.
**Recommended Decision:** Finance/Compliance must define supported currencies.
**Owner:** Finance / Compliance

---

### Q33: How are shipping and logistics costs handled in quoting?
**Status:** Not Answered
**Evidence:** `Deal` entity has `incoterm` field but no logistics cost calculation.
**Confidence:** High
**Reasoning:** No freight integration, no shipping calculator, no logistics service module.
**Risk Level:** High
**Business Impact:** Buyers cannot get total landed cost. Surprise costs damage trust.
**Engineering Impact:** Major integration needed (freight APIs).
**Recommended Decision:** Product must decide if logistics cost estimation is pilot scope.
**Owner:** Product

---

### Q34: What is the expected quote-to-deal conversion rate?
**Status:** Not Answered
**Evidence:** None found. No conversion tracking.
**Confidence:** High
**Reasoning:** No analytics or KPI definitions for funnel conversion.
**Risk Level:** Medium
**Business Impact:** Cannot measure sales efficiency.
**Engineering Impact:** Would need analytics tracking.
**Recommended Decision:** Product must set conversion targets. Engineering must implement tracking.
**Owner:** Product / Engineering

---

### Q35: How are buyer-seller communications archived for compliance?
**Status:** Partially Answered
**Evidence:**
- `backend/src/messages/messages.service.ts` — Messages stored in `messages` table
- `backend/src/messages/messages.gateway.ts` — WebSocket for real-time messaging
- No explicit compliance archiving or tamper-proof storage
**Confidence:** High
**Reasoning:** Messages are persisted but no audit trail, no immutability guarantees, no compliance-specific archiving.
**Risk Level:** High
**Business Impact:** Regulatory compliance may require tamper-proof communication records.
**Engineering Impact:** Would need append-only message store with cryptographic verification.
**Recommended Decision:** Compliance must define archiving requirements. Engineering must implement.
**Owner:** Compliance / Engineering

---

### Q36: What happens to buyer data if they leave the platform?
**Status:** Not Answered
**Evidence:** Same as Q19 — soft delete only, no retention policy.
**Confidence:** High
**Reasoning:** No GDPR compliance framework. No data export.
**Risk Level:** Medium
**Business Impact:** Regulatory risk.
**Engineering Impact:** Need data governance features.
**Recommended Decision:** Legal must define data retention policy.
**Owner:** Legal

---

## III. CORRIDOR COMPLIANCE — Regulatory & Trade Rules

### Q37: Which countries have full compliance rule sets defined?
**Status:** Partially Answered
**Evidence:**
- `backend/src/compliance/compliance.service.ts` — Generic rule lookup by origin/destination
- `schema/01_core_schema.sql` — `compliance_rules` table structure
- No actual rule data in repository (only schema)
**Confidence:** High
**Reasoning:** The system can store rules but no rules are populated. DEV_STATUS.md mentions "compliance engine" but no specific country coverage.
**Risk Level:** Critical
**Business Impact:** Cannot operate in any corridor without compliance rules.
**Engineering Impact:** Rule engine exists but content is empty.
**Recommended Decision:** Compliance must populate rules for pilot corridors. Engineering must provide rule management UI.
**Owner:** Compliance / Product

---

### Q38: How are SPS (sanitary/phytosanitary) requirements mapped per product per corridor?
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `compliance_rules` has `product_category_id`, `requirement_type` enum including `sps_certificate`, `inspection`
- No actual SPS rule data
**Confidence:** High
**Reasoning:** Schema supports SPS rules but no data exists.
**Risk Level:** Critical
**Business Impact:** Agricultural trade cannot proceed without SPS compliance.
**Engineering Impact:** Rule engine ready but needs data.
**Recommended Decision:** Compliance must source SPS requirements per corridor.
**Owner:** Compliance

---

### Q39: Which certificates of origin are accepted per destination country?
**Status:** Not Answered
**Evidence:** No certificate of origin rules in compliance data.
**Confidence:** High
**Reasoning:** `requirement_type` enum includes `certificate_of_origin` but no rules exist.
**Risk Level:** Critical
**Business Impact:** Cannot validate origin certificates for customs clearance.
**Engineering Impact:** Need rule data.
**Recommended Decision:** Compliance must define certificate requirements per corridor.
**Owner:** Compliance

---

### Q40: How are preferential trade agreements (AfCFTA, EU-EPA) encoded?
**Status:** Not Answered
**Evidence:** No trade agreement entities or rules.
**Confidence:** High
**Reasoning:** No mention of AfCFTA, EU-EPA, or any trade agreement in codebase or docs.
**Risk Level:** Critical
**Business Impact:** Cannot calculate preferential tariffs. Major value proposition missing.
**Engineering Impact:** Major feature — would need tariff rule engine.
**Recommended Decision:** Compliance/Product must decide if trade agreement support is pilot scope.
**Owner:** Compliance / Product

---

### Q41: What is the process for updating compliance rules when regulations change?
**Status:** Not Answered
**Evidence:** `compliance-rule.entity.ts` has `ruleStatus`, `validFrom`, `validUntil` but no update workflow.
**Confidence:** High
**Reasoning:** Rules can be versioned by date but no change management process exists.
**Risk Level:** High
**Business Impact:** Stale rules create compliance failures.
**Engineering Impact:** Would need rule versioning and notification system.
**Recommended Decision:** Compliance must define update process. Engineering must implement versioning.
**Owner:** Compliance / Engineering

---

### Q42: How are compliance violations flagged and escalated?
**Status:** Not Answered
**Evidence:** `ComplianceChecklistItem` has `status` enum (`pending`, `in_progress`, `completed`, `waived`, `not_required`) but no violation workflow.
**Confidence:** High
**Reasoning:** No escalation logic, no notification on violation, no deal blocking mechanism.
**Risk Level:** Critical
**Business Impact:** Non-compliant trades can proceed unchecked.
**Engineering Impact:** Need violation detection and escalation workflow.
**Recommended Decision:** Compliance must define violation response. Engineering must implement.
**Owner:** Compliance / Engineering

---

### Q43: Are there corridor-specific document templates?
**Status:** Not Answered
**Evidence:** `Document` entity exists but no template system.
**Confidence:** High
**Reasoning:** Documents can be uploaded but no template generation, no corridor-specific forms.
**Risk Level:** High
**Business Impact:** Users must create documents manually. Error-prone.
**Engineering Impact:** Would need template engine with country-specific variants.
**Recommended Decision:** Product must decide if document templates are pilot scope.
**Owner:** Product

---

### Q44: How is customs tariff data sourced and kept current?
**Status:** Not Answered
**Evidence:** No tariff data, no tariff API integration.
**Confidence:** High
**Reasoning:** No mention of HS codes, customs tariffs, or duty calculations.
**Risk Level:** Critical
**Business Impact:** Cannot calculate landed costs. Cannot verify compliance.
**Engineering Impact:** Major integration needed (customs/tariff APIs).
**Recommended Decision:** Executive must decide if tariff calculation is pilot scope.
**Owner:** Executive / Compliance

---

### Q45: What happens if a shipment fails inspection at destination?
**Status:** Not Answered
**Evidence:** `Inspection` entity exists but no failure workflow.
**Confidence:** High
**Reasoning:** Inspections can be recorded but no failure cascade to deals or payments.
**Risk Level:** Critical
**Business Impact:** Failed shipments create disputes with no resolution path.
**Engineering Impact:** Need inspection result integration with deal/payment workflows.
**Recommended Decision:** Product/Legal must define failure process. Engineering must implement.
**Owner:** Product / Legal

---

### Q46: Are there banned or restricted product lists per corridor?
**Status:** Not Answered
**Evidence:** No prohibited product lists in compliance rules.
**Confidence:** High
**Reasoning:** No restriction logic exists.
**Risk Level:** Critical
**Business Impact:** Platform could facilitate illegal trade.
**Engineering Impact:** Need prohibited product screening.
**Recommended Decision:** Compliance must define restricted lists. Engineering must implement screening.
**Owner:** Compliance / Engineering

---

### Q47: How is compliance documentation authenticated (not forged)?
**Status:** Not Answered
**Evidence:** Documents can be uploaded but no verification against issuing authorities.
**Confidence:** High
**Reasoning:** No document verification API, no blockchain anchoring, no hash verification.
**Risk Level:** Critical
**Business Impact:** Forged documents create liability and compliance failure.
**Engineering Impact:** Major feature — document verification integration.
**Recommended Decision:** Compliance must define authentication requirements. Engineering must implement.
**Owner:** Compliance / Engineering

---

### Q48: What is the compliance SLA per corridor?
**Status:** Not Answered
**Evidence:** No SLA definitions.
**Confidence:** High
**Reasoning:** No processing time targets for compliance checks.
**Risk Level:** Medium
**Business Impact:** Cannot promise compliance turnaround times.
**Engineering Impact:** Would need SLA tracking.
**Recommended Decision:** Product must define compliance SLAs.
**Owner:** Product

---

## IV. PAYMENTS & FINANCE — Revenue & Transactions

### Q49: What is the platform fee structure?
**Status:** Answered
**Evidence:**
- `backend/src/deals/deals.service.ts:20` — `platformFee = totalValue * 0.01` (1%)
- `backend/src/deals/entities/deal.entity.ts` — `platformFeeUsd` field
**Confidence:** High
**Reasoning:** Code explicitly sets 1% platform fee on deal creation.
**Risk Level:** Low
**Business Impact:** 1% may not cover operational costs at low volume.
**Engineering Impact:** Implemented.
**Recommended Decision:** Finance must validate if 1% is sustainable.
**Owner:** Finance

---

### Q50: Who holds funds in escrow? AATOS or third party?
**Status:** Contradicted
**Evidence:**
- `ARCHITECTURE.md` — Claims "escrow service integration" and "payment orchestration"
- `backend/src/payments/payments.service.ts` — `releasePayment` sets status to `released` but does NOT actually transfer funds. Comment: "In production: trigger Flutterwave transfer to payee"
- `backend/src/payments/flutterwave.service.ts:120` — `initiateEscrow` is a wrapper around `initiatePayment` with comment "Escrow is simulated via subaccount splits"
**Confidence:** High
**Reasoning:** Architecture claims escrow exists. Code simulates escrow. No actual escrow mechanism. Funds never leave payer's control in the simulated flow.
**Risk Level:** Critical
**Business Impact:** Cannot offer real escrow. Major trust mechanism is fake.
**Engineering Impact:** Need real escrow integration (Flutterwave subaccounts or dedicated escrow provider).
**Recommended Decision:** Engineering must implement real escrow or remove escrow claims.
**Owner:** Engineering / Executive

---

### Q51: What payment providers are integrated?
**Status:** Partially Answered
**Evidence:**
- `backend/src/payments/flutterwave.service.ts` — Flutterwave integration only
- `backend/src/payments/payments.module.ts` — Only FlutterwaveService registered
- No other payment providers
**Confidence:** High
**Reasoning:** Only Flutterwave is implemented. No Stripe, no PayPal, no bank transfer, no mobile money.
**Risk Level:** High
**Business Impact:** Limited to Flutterwave-supported markets and methods.
**Engineering Impact:** Would need additional provider integrations.
**Recommended Decision:** Executive must decide required payment methods for pilot.
**Owner:** Executive / Engineering

---

### Q52: How are multi-currency conversions handled?
**Status:** Not Answered
**Evidence:** Currency fields exist but no conversion logic.
**Confidence:** High
**Reasoning:** `amountUsd` fields suggest USD normalization but no exchange rate service, no conversion API.
**Risk Level:** High
**Business Impact:** Cannot guarantee fair pricing across currencies.
**Engineering Impact:** Need exchange rate integration (XE, OpenExchangeRates).
**Recommended Decision:** Finance/Product must define currency policy. Engineering must implement conversion.
**Owner:** Finance / Engineering

---

### Q53: What is the refund policy for cancelled deals?
**Status:** Not Answered
**Evidence:** `flutterwave.service.ts:133` — `refundTransaction` exists but no policy defines when refunds apply.
**Confidence:** High
**Reasoning:** Refund API exists but no business rules for cancellation, no deal cancellation workflow.
**Risk Level:** Critical
**Business Impact:** Refund disputes will arise with no policy framework.
**Engineering Impact:** Need cancellation workflow with refund rules.
**Recommended Decision:** Legal must define refund policy. Engineering must implement.
**Owner:** Legal / Product

---

### Q54: How are chargebacks handled?
**Status:** Not Answered
**Evidence:** No chargeback handling logic.
**Confidence:** High
**Reasoning:** No dispute handling, no chargeback notification processing.
**Risk Level:** Critical
**Business Impact:** Chargebacks create financial loss and account risk.
**Engineering Impact:** Need chargeback webhook handling.
**Recommended Decision:** Finance/Legal must define chargeback policy. Engineering must implement.
**Owner:** Finance / Legal

---

### Q55: Are there financing products for buyers or suppliers?
**Status:** Not Answered
**Evidence:** `org_type` includes `trade_finance` and `bank` but no trade finance module.
**Confidence:** High
**Reasoning:** No lending, no invoice factoring, no purchase order financing.
**Risk Level:** High
**Business Impact:** Major revenue stream (trade finance) is completely absent.
**Engineering Impact:** Major feature gap.
**Recommended Decision:** Executive must decide if trade finance is pilot scope.
**Owner:** Executive / Finance

---

### Q56: What is the revenue model beyond transaction fees?
**Status:** Not Answered
**Evidence:** Only 1% transaction fee exists. No subscription, no premium features.
**Confidence:** High
**Reasoning:** No alternative revenue streams implemented or documented.
**Risk Level:** High
**Business Impact:** Single revenue stream is risky and may be insufficient.
**Engineering Impact:** None yet — need business model first.
**Recommended Decision:** Executive must define revenue model (subscriptions, premium, data, etc.).
**Owner:** Executive / Finance

---

### Q57: How are payment disputes between buyer and seller resolved?
**Status:** Not Answered
**Evidence:** No dispute resolution logic. `releasePayment` can be triggered by either party.
**Confidence:** High
**Reasoning:** `payments.controller.ts:74` — "Both parties can trigger release based on milestone completion" — but no verification of milestone completion, no dispute process.
**Risk Level:** Critical
**Business Impact:** Funds can be released without genuine completion.
**Engineering Impact:** Need dispute resolution workflow.
**Recommended Decision:** Legal must define dispute process. Engineering must implement.
**Owner:** Legal / Engineering

---

### Q58: What are the FX hedging arrangements?
**Status:** Not Answered
**Evidence:** None found. No FX hedging logic.
**Confidence:** High
**Reasoning:** No hedging, no forward contracts, no currency risk management.
**Risk Level:** Medium
**Business Impact:** Currency fluctuation risk for long-dated deals.
**Engineering Impact:** Would need financial instrument integration.
**Recommended Decision:** Finance must decide if FX hedging is needed.
**Owner:** Finance

---

### Q59: How is revenue recognized and reported for accounting?
**Status:** Not Answered
**Evidence:** No accounting module, no revenue recognition logic.
**Confidence:** High
**Reasoning:** Platform fees are calculated but not recognized in any accounting system.
**Risk Level:** Medium
**Business Impact:** Cannot produce financial statements.
**Engineering Impact:** Would need accounting integration.
**Recommended Decision:** Finance must define revenue recognition policy. Engineering must implement reporting.
**Owner:** Finance / Engineering

---

### Q60: What is the capital requirement to cover float/escrow?
**Status:** Not Answered
**Evidence:** No escrow exists (see Q50). No capital modeling.
**Confidence:** High
**Reasoning:** Without real escrow, no float is needed. But if escrow is implemented, capital requirements are undefined.
**Risk Level:** High
**Business Impact:** Cannot plan liquidity needs.
**Engineering Impact:** None currently.
**Recommended Decision:** Finance must model capital requirements if escrow is implemented.
**Owner:** Finance

---

## V. LOGISTICS & FULFILLMENT — Movement of Goods

### Q61: Which logistics partners are integrated?
**Status:** Not Answered
**Evidence:** No logistics integrations. No freight forwarder APIs.
**Confidence:** High
**Reasoning:** `org_type` includes `freight_forwarder` but no integration with any logistics service.
**Risk Level:** Critical
**Business Impact:** Cannot track shipments, provide quotes, or verify delivery.
**Engineering Impact:** Major integration needed.
**Recommended Decision:** Executive must decide logistics strategy (partner, build, or defer).
**Owner:** Executive

---

### Q62: How are shipping quotes obtained?
**Status:** Not Answered
**Evidence:** No shipping quote functionality.
**Confidence:** High
**Reasoning:** No freight API integration, no shipping calculator.
**Risk Level:** High
**Business Impact:** Buyers cannot estimate total cost.
**Engineering Impact:** Would need freight API integration.
**Recommended Decision:** Product must decide if shipping quotes are pilot scope.
**Owner:** Product

---

### Q63: What Incoterms are supported?
**Status:** Partially Answered
**Evidence:**
- `schema/01_core_schema.sql` — `incoterm` field on deals
- `backend/src/deals/deals.service.ts` — No Incoterm validation
**Confidence:** High
**Reasoning:** Field exists but no validation, no Incoterm-specific logic.
**Risk Level:** Low
**Business Impact:** May accept invalid Incoterms.
**Engineering Impact:** Simple validation needed.
**Recommended Decision:** Product must define supported Incoterms. Engineering must validate.
**Owner:** Product / Engineering

---

### Q64: How is cargo insurance handled?
**Status:** Not Answered
**Evidence:** `org_type` includes `insurer` but no insurance module.
**Confidence:** High
**Reasoning:** No insurance quote integration, no policy management.
**Risk Level:** High
**Business Impact:** Cargo risk is uninsured. Platform liability.
**Engineering Impact:** Major feature gap.
**Recommended Decision:** Executive must decide if insurance is pilot scope.
**Owner:** Executive

---

### Q65: How are cold chain requirements tracked?
**Status:** Not Answered
**Evidence:** None found. No temperature tracking, no cold chain logic.
**Confidence:** High
**Reasoning:** No IoT integration, no temperature logging.
**Risk Level:** Medium
**Business Impact:** Perishable goods quality cannot be guaranteed.
**Engineering Impact:** Would need IoT integration.
**Recommended Decision:** Product must decide if cold chain is pilot scope.
**Owner:** Product

---

### Q66: What happens if a shipment is delayed?
**Status:** Not Answered
**Evidence:** No delay handling logic.
**Confidence:** High
**Reasoning:** No delay notifications, no SLA enforcement, no penalty logic.
**Risk Level:** Medium
**Business Impact:** Delayed shipments damage trust.
**Engineering Impact:** Would need logistics tracking integration.
**Recommended Decision:** Product must define delay handling policy.
**Owner:** Product

---

### Q67: How is proof of delivery verified?
**Status:** Not Answered
**Evidence:** `DealMilestone` has `delivery_confirmation` type but no verification logic.
**Confidence:** High
**Reasoning:** Milestone can be marked completed without proof.
**Risk Level:** High
**Business Impact:** False delivery confirmations possible.
**Engineering Impact:** Need delivery verification (BOL, GPS, photo).
**Recommended Decision:** Product must define proof of delivery requirements.
**Owner:** Product / Engineering

---

### Q68: Are there warehouse or storage integrations?
**Status:** Not Answered
**Evidence:** `org_type` includes `warehouse` but no warehouse module.
**Confidence:** High
**Reasoning:** No warehouse management, no inventory tracking.
**Risk Level:** Medium
**Business Impact:** Cannot track goods in storage.
**Engineering Impact:** Would need WMS integration.
**Recommended Decision:** Executive must decide if warehouse integration is needed.
**Owner:** Executive

---

## VI. PRODUCT & PLATFORM — Technical & UX

### Q69: What is the target user load for pilot?
**Status:** Not Answered
**Evidence:** No performance targets, no load testing documentation.
**Confidence:** High
**Reasoning:** No NFRs, no scalability targets.
**Risk Level:** Medium
**Business Impact:** Cannot plan infrastructure or evaluate if system will handle launch.
**Engineering Impact:** Would need load testing and capacity planning.
**Recommended Decision:** Engineering must set pilot load targets.
**Owner:** Engineering

---

### Q70: What is the uptime SLA?
**Status:** Not Answered
**Evidence:** No SLA documentation. `health.controller.ts` exists but no SLA.
**Confidence:** High
**Reasoning:** Health check exists but no uptime commitment.
**Risk Level:** Medium
**Business Impact:** Cannot promise reliability to users.
**Engineering Impact:** Need monitoring and SLO definitions.
**Recommended Decision:** Engineering must define uptime SLA.
**Owner:** Engineering

---

### Q71: What is the disaster recovery plan?
**Status:** Not Answered
**Evidence:** No DR documentation. `DEPLOYMENT.md` describes staging only.
**Confidence:** High
**Reasoning:** No backup strategy, no failover, no RTO/RPO.
**Risk Level:** Critical
**Business Impact:** Data loss risk. Cannot recover from incidents.
**Engineering Impact:** Need DR strategy and implementation.
**Recommended Decision:** Engineering must define DR plan.
**Owner:** Engineering

---

### Q72: How is PII data protected?
**Status:** Partially Answered
**Evidence:**
- `backend/src/main.ts:20` — Helmet middleware for security headers
- `backend/src/main.ts:23` — CORS configured
- No encryption at rest documented. No DPO. No privacy policy.
**Confidence:** Medium
**Reasoning:** Basic security headers exist but no comprehensive PII protection framework.
**Risk Level:** Critical
**Business Impact:** GDPR/POPIA violation risk.
**Engineering Impact:** Need privacy by design implementation.
**Recommended Decision:** Legal/Compliance must define PII requirements. Engineering must implement.
**Owner:** Legal / Engineering

---

### Q73: What is the data retention policy?
**Status:** Not Answered
**Evidence:** No retention policy found.
**Confidence:** High
**Reasoning:** Soft delete exists but no retention schedule, no data purging.
**Risk Level:** High
**Business Impact:** Regulatory non-compliance.
**Engineering Impact:** Need retention policy and automated purging.
**Recommended Decision:** Legal must define retention policy.
**Owner:** Legal

---

### Q74: How are API rate limits enforced?
**Status:** Partially Answered
**Evidence:**
- `backend/src/common/rate-limit.guard.ts` — Rate limit guard exists
- `backend/src/app.module.ts:27` — `RateLimitGuard` registered globally
- No specific limits documented
**Confidence:** Medium
**Reasoning:** Rate limiting infrastructure exists but no limits are configured or documented.
**Risk Level:** Medium
**Business Impact:** API abuse possible.
**Engineering Impact:** Need limit configuration.
**Recommended Decision:** Engineering must define and document rate limits.
**Owner:** Engineering

---

### Q75: What is the mobile app roadmap?
**Status:** Partially Answered
**Evidence:**
- `frontend/mobile/` — React Native project exists (package.json, App.tsx)
- `DEV_STATUS.md` — "Mobile app (React Native) — planned"
- Mobile app appears to be minimal/stub
**Confidence:** High
**Reasoning:** Mobile directory exists but appears to be a template/stub. No significant mobile implementation.
**Risk Level:** Medium
**Business Impact:** Mobile is critical for field-based suppliers.
**Engineering Impact:** Major development needed.
**Recommended Decision:** Product must define mobile MVP scope and timeline.
**Owner:** Product / Engineering

---

### Q76: How are real-time notifications delivered?
**Status:** Answered
**Evidence:**
- `backend/src/notifications/notifications.gateway.ts` — WebSocket gateway
- `backend/src/notifications/notifications.service.ts:34` — Push via gateway, email via EmailService
- WebSocket events: `notification`, `unread_count`
**Confidence:** High
**Reasoning:** Full WebSocket + email notification system implemented.
**Risk Level:** Low
**Business Impact:** Real-time engagement enabled.
**Engineering Impact:** Implemented.
**Recommended Decision:** None — feature exists.
**Owner:** Engineering

---

### Q77: What analytics and reporting exist?
**Status:** Not Answered
**Evidence:** No analytics module. No reporting dashboards.
**Confidence:** High
**Reasoning:** No analytics tracking, no BI integration, no admin reporting.
**Risk Level:** Medium
**Business Impact:** Cannot measure platform performance or user behavior.
**Engineering Impact:** Would need analytics pipeline (Segment, Mixpanel, or custom).
**Recommended Decision:** Product must define analytics requirements. Engineering must implement.
**Owner:** Product / Engineering

---

### Q78: How is search implemented?
**Status:** Partially Answered
**Evidence:**
- `backend/src/products/products.service.ts:54` — Full-text search with ILIKE
- `backend/src/organizations/organizations.service.ts:67` — Search by name/legalName/city
- `schema/01_core_schema.sql` — `pg_trgm` extension installed
- No Elasticsearch, no advanced search
**Confidence:** High
**Reasoning:** Basic PostgreSQL text search. No faceted search, no relevance ranking.
**Risk Level:** Low
**Business Impact:** Search is functional but basic.
**Engineering Impact:** Would need search engine for advanced features.
**Recommended Decision:** Product must decide if advanced search is needed for pilot.
**Owner:** Product

---

### Q79: What is the CI/CD pipeline?
**Status:** Partially Answered
**Evidence:**
- `docker-compose.yml` and `docker-compose.dev.yml` exist
- No GitHub Actions, no Jenkins, no CI config found
- `DEPLOYMENT.md` mentions Vercel deployment
**Confidence:** High
**Reasoning:** Docker setup exists but no automated CI/CD pipeline visible.
**Risk Level:** Medium
**Business Impact:** Manual deployment is error-prone and slow.
**Engineering Impact:** Need CI/CD setup.
**Recommended Decision:** Engineering must implement CI/CD.
**Owner:** Engineering

---

### Q80: How are database migrations managed?
**Status:** Partially Answered
**Evidence:**
- `backend/src/database/database.module.ts` — TypeORM with `synchronize: true`
- `schema/01_core_schema.sql` — Raw SQL schema exists
- No migration files in `backend/src/migrations/`
**Confidence:** High
**Reasoning:** `synchronize: true` is dangerous for production. No formal migration strategy.
**Risk Level:** Critical
**Business Impact:** Data loss risk in production. Schema changes are uncontrolled.
**Engineering Impact:** Need migration strategy (TypeORM migrations or Flyway).
**Recommended Decision:** Engineering must disable `synchronize` and implement migrations.
**Owner:** Engineering

---

### Q81: What is the testing coverage?
**Status:** Contradicted
**Evidence:**
- `DEV_STATUS.md` — Claims "comprehensive test coverage"
- `backend/package.json` — `jest` in devDependencies
- No test files found in repository (`.spec.ts` or `.test.ts`)
**Confidence:** High
**Reasoning:** DEV_STATUS claims tests exist but no test files are in the repository.
**Risk Level:** Critical
**Business Impact:** Untested code in production is high risk.
**Engineering Impact:** Need comprehensive test suite.
**Recommended Decision:** Engineering must write tests or remove claim from DEV_STATUS.
**Owner:** Engineering

---

### Q82: How is feature flagging handled?
**Status:** Not Answered
**Evidence:** No feature flag system found.
**Confidence:** High
**Reasoning:** No LaunchDarkly, no Unleash, no custom flag system.
**Risk Level:** Medium
**Business Impact:** Cannot safely roll out features or do A/B testing.
**Engineering Impact:** Would need feature flag integration.
**Recommended Decision:** Engineering must decide if feature flags are needed.
**Owner:** Engineering

---

### Q83: What is the frontend state management approach?
**Status:** Answered
**Evidence:**
- `frontend/web/src/stores/authStore.ts` — Zustand with persist middleware
- `frontend/web/package.json` — `zustand` dependency
**Confidence:** High
**Reasoning:** Zustand is used for state management.
**Risk Level:** Low
**Business Impact:** Standard approach, maintainable.
**Engineering Impact:** Implemented.
**Recommended Decision:** None.
**Owner:** Engineering

---

### Q84: How are errors handled and logged?
**Status:** Partially Answered
**Evidence:**
- `backend/src/common/filters/http-exception.filter.ts` — Global exception filter
- `backend/src/main.ts:31` — Exception filter registered globally
- No structured logging (Winston/Pino), no log aggregation
**Confidence:** High
**Reasoning:** Basic error handling exists but no structured logging or observability.
**Risk Level:** Medium
**Business Impact:** Hard to debug production issues.
**Engineering Impact:** Need logging framework and aggregation.
**Recommended Decision:** Engineering must implement structured logging.
**Owner:** Engineering

---

## VII. TEAM & GOVERNANCE — Execution Capability

### Q85: What roles are defined and filled?
**Status:** Not Answered
**Evidence:** No team documentation, no org chart.
**Confidence:** High
**Reasoning:** No evidence of team structure in any file.
**Risk Level:** Medium
**Business Impact:** Cannot assess execution capability.
**Engineering Impact:** None.
**Recommended Decision:** Executive must document team structure.
**Owner:** Executive

---

### Q86: What is the development velocity (story points per sprint)?
**Status:** Not Answered
**Evidence:** No agile process documentation.
**Confidence:** High
**Reasoning:** No sprint metrics, no velocity tracking.
**Risk Level:** Low
**Business Impact:** Cannot estimate delivery timelines.
**Engineering Impact:** None.
**Recommended Decision:** Engineering must implement tracking if using agile.
**Owner:** Engineering

---

### Q87: What is the bug backlog size and severity distribution?
**Status:** Not Answered
**Evidence:** No issue tracker visible.
**Confidence:** High
**Reasoning:** No GitHub Issues, no Jira, no bug tracking.
**Risk Level:** Medium
**Business Impact:** Cannot assess code quality or stability.
**Engineering Impact:** Need issue tracking system.
**Recommended Decision:** Engineering must set up issue tracking.
**Owner:** Engineering

---

### Q88: What is the technical debt register?
**Status:** Not Answered
**Evidence:** No technical debt documentation.
**Confidence:** High
**Reasoning:** No TODOs tracked, no debt register.
**Risk Level:** Medium
**Business Impact:** Debt accumulates without visibility.
**Engineering Impact:** Need debt tracking process.
**Recommended Decision:** Engineering must maintain debt register.
**Owner:** Engineering

---

### Q89: How are production incidents handled?
**Status:** Not Answered
**Evidence:** No incident response documentation.
**Confidence:** High
**Reasoning:** No runbooks, no on-call rotation, no incident response plan.
**Risk Level:** Critical
**Business Impact:** Production issues will have no response protocol.
**Engineering Impact:** Need incident response plan.
**Recommended Decision:** Engineering must define incident response.
**Owner:** Engineering

---

### Q90: What is the code review process?
**Status:** Not Answered
**Evidence:** No contributing guidelines, no PR template.
**Confidence:** High
**Reasoning:** No process documentation visible.
**Risk Level:** Medium
**Business Impact:** Code quality may degrade.
**Engineering Impact:** Need review process.
**Recommended Decision:** Engineering must define review process.
**Owner:** Engineering

---

### Q91: How is documentation maintained?
**Status:** Contradicted
**Evidence:**
- `DEV_STATUS.md` — Claims "comprehensive documentation"
- `README.md` — Basic, missing many sections
- `docs/SECURITY.md` — Does not exist (README says it should)
- API docs are Swagger auto-generated, not maintained
**Confidence:** High
**Reasoning:** Claims comprehensive docs but SECURITY.md is missing, API spec is aspirational vs. implemented.
**Risk Level:** Medium
**Business Impact:** Onboarding and maintenance suffer.
**Engineering Impact:** Need documentation discipline.
**Recommended Decision:** Engineering must create SECURITY.md and maintain docs.
**Owner:** Engineering

---

### Q92: What is the security audit schedule?
**Status:** Not Answered
**Evidence:** No security audit documentation.
**Confidence:** High
**Reasoning:** No pentest schedule, no security review process.
**Risk Level:** Critical
**Business Impact:** Undiscovered vulnerabilities.
**Engineering Impact:** Need security audit plan.
**Recommended Decision:** Engineering/Security must define audit schedule.
**Owner:** Engineering

---

### Q93: How are third-party dependencies monitored for vulnerabilities?
**Status:** Not Answered
**Evidence:** No Snyk, no Dependabot config found.
**Confidence:** High
**Reasoning:** No dependency scanning visible.
**Risk Level:** Medium
**Business Impact:** Vulnerable dependencies create security risk.
**Engineering Impact:** Need dependency scanning.
**Recommended Decision:** Engineering must implement dependency monitoring.
**Owner:** Engineering

---

### Q94: What is the access control model for production?
**Status:** Not Answered
**Evidence:** No production access documentation.
**Confidence:** High
**Reasoning:** No IAM policy, no access matrix.
**Risk Level:** High
**Business Impact:** Unauthorized production access possible.
**Engineering Impact:** Need access control policy.
**Recommended Decision:** Engineering must define production access model.
**Owner:** Engineering

---

## VIII. GROWTH & COMPETITION — Market Position

### Q95: Who are the direct competitors?
**Status:** Not Answered
**Evidence:** No competitive analysis in repository.
**Confidence:** High
**Reasoning:** No competitor list, no differentiation strategy.
**Risk Level:** Medium
**Business Impact:** Cannot position or differentiate.
**Engineering Impact:** None.
**Recommended Decision:** Product/Marketing must conduct competitive analysis.
**Owner:** Product / Marketing

---

### Q96: What is the unique value proposition vs. competitors?
**Status:** Partially Answered
**Evidence:**
- `README.md` — "operating system for global agricultural trade"
- `ARCHITECTURE.md` — Compliance-as-data, immutable audit trail
- No competitive comparison
**Confidence:** Medium
**Reasoning:** UVP is stated but not validated against competitors.
**Risk Level:** High
**Business Impact:** May not be differentiated enough.
**Engineering Impact:** None.
**Recommended Decision:** Product must validate UVP against competitors.
**Owner:** Product / Marketing

---

### Q97: What is the go-to-market strategy?
**Status:** Not Answered
**Evidence:** No GTM documentation.
**Confidence:** High
**Reasoning:** No marketing plan, no channel strategy, no launch plan.
**Risk Level:** Critical
**Business Impact:** Product may not reach market.
**Engineering Impact:** None.
**Recommended Decision:** Executive/Marketing must define GTM strategy.
**Owner:** Executive / Marketing

---

### Q98: What is the customer acquisition strategy?
**Status:** Not Answered
**Evidence:** No acquisition strategy documented.
**Confidence:** High
**Reasoning:** No channels, no campaigns, no budget.
**Risk Level:** Critical
**Business Impact:** No customers without acquisition.
**Engineering Impact:** None.
**Recommended Decision:** Marketing must define acquisition strategy.
**Owner:** Marketing

---

### Q99: What partnerships are in place or planned?
**Status:** Not Answered
**Evidence:** `org_type` supports partner types but no partnership documentation.
**Confidence:** High
**Reasoning:** No partner agreements, no integration commitments.
**Risk Level:** High
**Business Impact:** Platform credibility depends on partnerships.
**Engineering Impact:** None.
**Recommended Decision:** Executive must define partnership strategy.
**Owner:** Executive

---

### Q100: What is the pricing strategy for enterprise customers?
**Status:** Not Answered
**Evidence:** Only 1% transaction fee exists. No enterprise pricing.
**Confidence:** High
**Reasoning:** No tiered pricing, no enterprise features.
**Risk Level:** High
**Business Impact:** Cannot monetize large customers.
**Engineering Impact:** None yet.
**Recommended Decision:** Executive/Finance must define enterprise pricing.
**Owner:** Executive / Finance

---

### Q101: How is churn defined and measured?
**Status:** Not Answered
**Evidence:** No churn metrics, no cohort analysis.
**Confidence:** High
**Reasoning:** No analytics for retention.
**Risk Level:** Medium
**Business Impact:** Cannot identify or fix churn drivers.
**Engineering Impact:** Need analytics.
**Recommended Decision:** Product must define churn metrics. Engineering must implement tracking.
**Owner:** Product / Engineering

---

### Q102: What is the net revenue retention target?
**Status:** Not Answered
**Evidence:** No revenue retention metrics.
**Confidence:** High
**Reasoning:** No NRR tracking.
**Risk Level:** Medium
**Business Impact:** Cannot measure business health.
**Engineering Impact:** Need analytics.
**Recommended Decision:** Finance must set NRR targets.
**Owner:** Finance

---

### Q103: What is the expansion revenue strategy?
**Status:** Not Answered
**Evidence:** No expansion features, no upsell mechanism.
**Confidence:** High
**Reasoning:** No premium tiers, no add-ons.
**Risk Level:** Medium
**Business Impact:** Revenue per customer is flat.
**Engineering Impact:** None yet.
**Recommended Decision:** Executive must define expansion strategy.
**Owner:** Executive

---

### Q104: How is product-market fit measured?
**Status:** Not Answered
**Evidence:** No PMF metrics, no NPS, no usage analytics.
**Confidence:** High
**Reasoning:** No instrumentation for PMF measurement.
**Risk Level:** Critical
**Business Impact:** Cannot validate product direction.
**Engineering Impact:** Need analytics and survey tools.
**Recommended Decision:** Product must define PMF metrics. Engineering must implement.
**Owner:** Product / Engineering

---

## IX. LEGAL & RISK — Liability, Contracts, IP

### Q105: What jurisdiction governs platform terms?
**Status:** Not Answered
**Evidence:** No terms of service, no jurisdiction specified.
**Confidence:** High
**Reasoning:** No legal documents in repository.
**Risk Level:** Critical
**Business Impact:** Platform operates without legal foundation.
**Engineering Impact:** None.
**Recommended Decision:** Legal must draft terms and specify jurisdiction.
**Owner:** Legal

---

### Q106: What is the platform's liability cap?
**Status:** Not Answered
**Evidence:** No liability terms.
**Confidence:** High
**Reasoning:** Unlimited liability exposure.
**Risk Level:** Critical
**Business Impact:** Catastrophic legal exposure.
**Engineering Impact:** None.
**Recommended Decision:** Legal must define liability cap.
**Owner:** Legal

---

### Q107: How are intellectual property rights handled for supplier data?
**Status:** Not Answered
**Evidence:** No IP policy.
**Confidence:** High
**Reasoning:** No terms defining data ownership.
**Risk Level:** Medium
**Business Impact:** Disputes over data ownership possible.
**Engineering Impact:** None.
**Recommended Decision:** Legal must define IP terms.
**Owner:** Legal

---

### Q108: What insurance does the platform carry?
**Status:** Not Answered
**Evidence:** No insurance documentation.
**Confidence:** High
**Reasoning:** No evidence of E&O, cyber, or liability insurance.
**Risk Level:** Critical
**Business Impact:** Uninsured losses possible.
**Engineering Impact:** None.
**Recommended Decision:** Executive must secure appropriate insurance.
**Owner:** Executive / Legal

---

### Q109: How are sanctions compliance checks performed?
**Status:** Not Answered
**Evidence:** No sanctions screening.
**Confidence:** High
**Reasoning:** No OFAC, UN, or EU sanctions checks.
**Risk Level:** Critical
**Business Impact:** Facilitating trade with sanctioned entities is illegal.
**Engineering Impact:** Need sanctions screening integration.
**Recommended Decision:** Compliance must implement sanctions screening.
**Owner:** Compliance / Legal

---

### Q110: What is the AML/KYC framework?
**Status:** Not Answered
**Evidence:** No KYC logic, no AML monitoring.
**Confidence:** High
**Reasoning:** `verification_level` exists but no KYC/AML specific checks.
**Risk Level:** Critical
**Business Impact:** Regulatory violation. Account freezing risk.
**Engineering Impact:** Major feature gap.
**Recommended Decision:** Compliance/Legal must define AML/KYC framework. Engineering must implement.
**Owner:** Compliance / Legal

---

### Q111: How are data protection regulations complied with (GDPR, POPIA)?
**Status:** Not Answered
**Evidence:** No privacy policy, no DPO, no consent management.
**Confidence:** High
**Reasoning:** No GDPR or POPIA compliance framework.
**Risk Level:** Critical
**Business Impact:** Regulatory fines possible.
**Engineering Impact:** Major compliance work needed.
**Recommended Decision:** Legal must define privacy framework. Engineering must implement.
**Owner:** Legal / Engineering

---

### Q112: What is the dispute resolution mechanism?
**Status:** Not Answered
**Evidence:** No dispute resolution (same as Q26).
**Confidence:** High
**Reasoning:** No arbitration, no mediation, no legal process.
**Risk Level:** Critical
**Business Impact:** Parties have no recourse.
**Engineering Impact:** Need workflow.
**Recommended Decision:** Legal must define mechanism.
**Owner:** Legal

---

### Q113: How are force majeure events handled?
**Status:** Not Answered
**Evidence:** No force majeure clauses.
**Confidence:** High
**Reasoning:** No terms, no policy.
**Risk Level:** Medium
**Business Impact:** No protection for pandemics, wars, natural disasters.
**Engineering Impact:** None.
**Recommended Decision:** Legal must define force majeure terms.
**Owner:** Legal

---

### Q114: What is the subcontractor or third-party liability chain?
**Status:** Not Answered
**Evidence:** No subcontractor terms.
**Confidence:** High
**Reasoning:** No liability allocation for logistics, payment, or verification partners.
**Risk Level:** High
**Business Impact:** Unclear who is liable for partner failures.
**Engineering Impact:** None.
**Recommended Decision:** Legal must define liability chain.
**Owner:** Legal

---

## X. METRICS & PERFORMANCE — Operational Intelligence

### Q115: What is the CAC payback period target?
**Status:** Not Answered
**Evidence:** No CAC or LTV metrics.
**Confidence:** High
**Reasoning:** No unit economics model.
**Risk Level:** Medium
**Business Impact:** Cannot evaluate profitability.
**Engineering Impact:** None.
**Recommended Decision:** Finance must model CAC and payback.
**Owner:** Finance

---

### Q116: What is the target gross margin per transaction?
**Status:** Not Answered
**Evidence:** 1% fee exists but no cost model.
**Confidence:** High
**Reasoning:** Cannot calculate margin without cost data.
**Risk Level:** High
**Business Impact:** May be unprofitable per transaction.
**Engineering Impact:** None.
**Recommended Decision:** Finance must model transaction economics.
**Owner:** Finance

---

### Q117: What is the target monthly burn rate?
**Status:** Not Answered
**Evidence:** No financial model.
**Confidence:** High
**Reasoning:** No budget, no burn tracking.
**Risk Level:** Medium
**Business Impact:** Cannot plan runway.
**Engineering Impact:** None.
**Recommended Decision:** Finance must set burn target.
**Owner:** Finance

---

### Q118: What is the runway in months?
**Status:** Not Answered
**Evidence:** No financial data.
**Confidence:** High
**Reasoning:** No funding information.
**Risk Level:** Critical
**Business Impact:** Unknown if company can survive to launch.
**Engineering Impact:** None.
**Recommended Decision:** Executive must disclose runway.
**Owner:** Executive / Finance

---

### Q119: What is the break-even transaction volume?
**Status:** Not Answered
**Evidence:** No break-even analysis.
**Confidence:** High
**Reasoning:** No volume targets.
**Risk Level:** High
**Business Impact:** Cannot set operational targets.
**Engineering Impact:** None.
**Recommended Decision:** Finance must calculate break-even.
**Owner:** Finance

---

### Q120: What is the target NPS score?
**Status:** Not Answered
**Evidence:** No NPS mechanism.
**Confidence:** High
**Reasoning:** No customer satisfaction measurement.
**Risk Level:** Medium
**Business Impact:** Cannot measure satisfaction.
**Engineering Impact:** Need NPS integration.
**Recommended Decision:** Product must set NPS target. Engineering must implement.
**Owner:** Product / Engineering

---

### Q121: What is the target support ticket resolution time?
**Status:** Not Answered
**Evidence:** No support system.
**Confidence:** High
**Reasoning:** No ticketing, no SLA.
**Risk Level:** Medium
**Business Impact:** Customer issues unresolved.
**Engineering Impact:** Need support platform.
**Recommended Decision:** Product must define support SLA.
**Owner:** Product

---

### Q122: How is fraud detected and prevented?
**Status:** Not Answered
**Evidence:** No fraud detection logic.
**Confidence:** High
**Reasoning:** No risk scoring, no transaction monitoring, no anomaly detection.
**Risk Level:** Critical
**Business Impact:** Fraud losses, regulatory action.
**Engineering Impact:** Major feature gap.
**Recommended Decision:** Compliance/Engineering must implement fraud detection.
**Owner:** Compliance / Engineering

---

### Q123: What is the false positive rate target for automated checks?
**Status:** Not Answered
**Evidence:** No automated checks exist.
**Confidence:** High
**Reasoning:** N/A — no checks to measure.
**Risk Level:** Medium
**Business Impact:** Cannot optimize checks.
**Engineering Impact:** None.
**Recommended Decision:** N/A until checks are implemented.
**Owner:** N/A

---

### Q124: How is platform health monitored?
**Status:** Partially Answered
**Evidence:**
- `backend/src/health/health.controller.ts` — Basic health check
- No monitoring dashboards, no alerting
**Confidence:** High
**Reasoning:** Health endpoint exists but no comprehensive monitoring.
**Risk Level:** Medium
**Business Impact:** Cannot detect or respond to issues.
**Engineering Impact:** Need monitoring stack (Datadog, Grafana).
**Recommended Decision:** Engineering must implement monitoring.
**Owner:** Engineering

---

## XI. STRATEGIC & FUTURE STATE — Vision & Roadmap

### Q125: What is the 3-year revenue target?
**Status:** Not Answered
**Evidence:** No financial projections.
**Confidence:** High
**Reasoning:** No revenue model, no targets.
**Risk Level:** Critical
**Business Impact:** No north star metric.
**Engineering Impact:** None.
**Recommended Decision:** Executive must set 3-year target.
**Owner:** Executive / Finance

---

### Q126: What markets will be entered in Year 2?
**Status:** Not Answered
**Evidence:** No market expansion plan.
**Confidence:** High
**Reasoning:** No corridor commitments even for pilot.
**Risk Level:** High
**Business Impact:** Cannot plan expansion.
**Engineering Impact:** None.
**Recommended Decision:** Executive must define Year 2 markets.
**Owner:** Executive

---

### Q127: What is the fundraising strategy?
**Status:** Not Answered
**Evidence:** No fundraising documentation.
**Confidence:** High
**Reasoning:** No investor materials, no pitch deck in repo.
**Risk Level:** Critical
**Business Impact:** Unknown if company can fund growth.
**Engineering Impact:** None.
**Recommended Decision:** Executive must define fundraising plan.
**Owner:** Executive

---

### Q128: What is the exit strategy?
**Status:** Not Answered
**Evidence:** No exit planning.
**Confidence:** High
**Reasoning:** No acquisition, IPO, or sustainability plan.
**Risk Level:** Medium
**Business Impact:** No long-term direction.
**Engineering Impact:** None.
**Recommended Decision:** Executive must define long-term strategy.
**Owner:** Executive

---

### Q129: What is the defensibility moat?
**Status:** Not Answered
**Evidence:** No competitive strategy.
**Confidence:** High
**Reasoning:** Network effects are assumed but not engineered.
**Risk Level:** High
**Business Impact:** Competitors can replicate features.
**Engineering Impact:** None.
**Recommended Decision:** Executive must define and build moat.
**Owner:** Executive

---

### Q130: What is the data monetization strategy?
**Status:** Not Answered
**Evidence:** No data products, no analytics API.
**Confidence:** High
**Reasoning:** Data is collected but not monetized.
**Risk Level:** Medium
**Business Impact:** Revenue stream untapped.
**Engineering Impact:** Would need data products.
**Recommended Decision:** Executive must decide if data monetization is part of strategy.
**Owner:** Executive

---

### Q131: How will the platform handle commodity price volatility?
**Status:** Not Answered
**Evidence:** No price hedging, no volatility tools.
**Confidence:** High
**Reasoning:** Prices are static in deals. No commodity market data.
**Risk Level:** High
**Business Impact:** Price changes break deals.
**Engineering Impact:** Would need commodity price feeds.
**Recommended Decision:** Product must decide if price volatility tools are needed.
**Owner:** Product

---

### Q132: What is the blockchain or distributed ledger strategy?
**Status:** Not Answered
**Evidence:** `ARCHITECTURE.md` mentions "immutable audit trail" but no blockchain implementation.
**Confidence:** High
**Reasoning:** Immutable trail is aspirational. No DLT, no smart contracts.
**Risk Level:** Medium
**Business Impact:** Cannot offer verifiable provenance.
**Engineering Impact:** Would need significant blockchain work.
**Recommended Decision:** Executive must decide if blockchain is needed.
**Owner:** Executive

---

### Q133: How will AI/ML be used for matching or risk scoring?
**Status:** Not Answered
**Evidence:** No ML models, no matching algorithm beyond basic filtering.
**Confidence:** High
**Reasoning:** Matching is database query only. No ML pipeline.
**Risk Level:** Medium
**Business Impact:** Matching quality is limited.
**Engineering Impact:** Would need ML infrastructure.
**Recommended Decision:** Product must decide if ML is pilot scope.
**Owner:** Product

---

### Q134: What is the API partner ecosystem strategy?
**Status:** Not Answered
**Evidence:** No partner API, no developer portal.
**Confidence:** High
**Reasoning:** API exists but is for internal use only.
**Risk Level:** Medium
**Business Impact:** Cannot build partner network.
**Engineering Impact:** Would need partner API program.
**Recommended Decision:** Executive must define partner strategy.
**Owner:** Executive

---

### Q135: How will the platform integrate with government trade systems?
**Status:** Not Answered
**Evidence:** `org_type` includes `government` but no integration.
**Confidence:** High
**Reasoning:** No customs API, no trade portal integration.
**Risk Level:** Medium
**Business Impact:** Cannot offer streamlined customs clearance.
**Engineering Impact:** Major integration needed.
**Recommended Decision:** Executive must decide if government integration is needed.
**Owner:** Executive

---

### Q136: What is the white-label or licensing strategy?
**Status:** Not Answered
**Evidence:** No white-label features.
**Confidence:** High
**Reasoning:** Single tenant only. No customization for partners.
**Risk Level:** Medium
**Business Impact:** Cannot monetize platform as service.
**Engineering Impact:** Would need multi-tenancy.
**Recommended Decision:** Executive must decide if white-label is part of strategy.
**Owner:** Executive

---

### Q137: How will the platform handle sustainability reporting (carbon, ESG)?
**Status:** Not Answered
**Evidence:** No ESG fields, no carbon tracking.
**Confidence:** High
**Reasoning:** No sustainability features.
**Risk Level:** Medium
**Business Impact:** Cannot serve ESG-focused buyers.
**Engineering Impact:** Would need sustainability module.
**Recommended Decision:** Product must decide if ESG is needed.
**Owner:** Product

---

### Q138: What is the farmer direct-to-buyer strategy?
**Status:** Not Answered
**Evidence:** `org_type` includes `farmer` but no farmer-specific features.
**Confidence:** High
**Reasoning:** Farmers can register but no smallholder-specific tools, no aggregation workflow.
**Risk Level:** High
**Business Impact:** Core supply side may be underserved.
**Engineering Impact:** Would need farmer-specific UX.
**Recommended Decision:** Product must define farmer strategy.
**Owner:** Product

---

### Q139: How will aggregation and cooperative management work?
**Status:** Not Answered
**Evidence:** Same as Q11. No cooperative management features.
**Confidence:** High
**Reasoning:** Cooperatives are org_type only.
**Risk Level:** Medium
**Business Impact:** Cannot manage cooperative structures.
**Engineering Impact:** Would need hierarchical org model.
**Recommended Decision:** Product must define cooperative features.
**Owner:** Product

---

### Q140: What is the traceability and provenance strategy?
**Status:** Partially Answered
**Evidence:**
- `ARCHITECTURE.md` — Claims "immutable audit trail"
- `backend/src/inspections/inspections.service.ts` — Inspection records
- No blockchain, no batch tracking, no end-to-end traceability
**Confidence:** Medium
**Reasoning:** Audit trail is aspirational. Inspections exist but no chain of custody.
**Risk Level:** High
**Business Impact:** Cannot offer provenance guarantees.
**Engineering Impact:** Major feature gap.
**Recommended Decision:** Product must define traceability requirements.
**Owner:** Product

---

### Q141: How will quality grading and inspection data be standardized?
**Status:** Partially Answered
**Evidence:**
- `backend/src/inspections/entities/inspection.entity.ts` — Inspection records
- `schema/01_core_schema.sql` — `inspection_type` enum
- No standard grading system, no inspector certification
**Confidence:** High
**Reasoning:** Inspections can be recorded but no standardization.
**Risk Level:** High
**Business Impact:** Quality data is incomparable across suppliers.
**Engineering Impact:** Would need grading standards.
**Recommended Decision:** Compliance must define grading standards.
**Owner:** Compliance

---

### Q142: What is the sample and trial shipment workflow?
**Status:** Not Answered
**Evidence:** No sample workflow, no trial shipment logic.
**Confidence:** High
**Reasoning:** No sample-specific deal type, no sample tracking.
**Risk Level:** Medium
**Business Impact:** Buyers cannot evaluate before committing.
**Engineering Impact:** Would need sample workflow.
**Recommended Decision:** Product must define sample workflow.
**Owner:** Product

---

### Q143: How will containerization and bulk shipping be handled?
**Status:** Not Answered
**Evidence:** No shipping mode logic.
**Confidence:** High
**Reasoning:** No FCL/LCL, no bulk cargo handling.
**Risk Level:** Medium
**Business Impact:** Cannot handle large shipments.
**Engineering Impact:** Would need shipping mode support.
**Recommended Decision:** Product must define shipping scope.
**Owner:** Product

---

### Q144: What is the warehousing and inventory strategy?
**Status:** Not Answered
**Evidence:** No inventory management, no warehouse integration.
**Confidence:** High
**Reasoning:** Products have quantity but no inventory tracking.
**Risk Level:** Medium
**Business Impact:** Cannot track stock levels.
**Engineering Impact:** Would need inventory module.
**Recommended Decision:** Product must define inventory scope.
**Owner:** Product

---

### Q145: How will last-mile delivery be managed?
**Status:** Not Answered
**Evidence:** No last-mile logic.
**Confidence:** High
**Reasoning:** No delivery tracking, no local courier integration.
**Risk Level:** Low
**Business Impact:** Last-mile is typically buyer-managed in B2B ag trade.
**Engineering Impact:** None.
**Recommended Decision:** Product must decide if last-mile is in scope.
**Owner:** Product

---

### Q146: What is the returns and rejections workflow?
**Status:** Not Answered
**Evidence:** No returns logic, no rejection workflow.
**Confidence:** High
**Reasoning:** No deal reversal, no return merchandise authorization.
**Risk Level:** High
**Business Impact:** Cannot handle quality failures.
**Engineering Impact:** Would need returns module.
**Recommended Decision:** Product must define returns workflow.
**Owner:** Product

---

### Q147: How will packaging and labeling requirements be enforced?
**Status:** Not Answered
**Evidence:** No packaging logic, no label requirements.
**Confidence:** High
**Reasoning:** Compliance rules could include packaging but no rules exist.
**Risk Level:** Medium
**Business Impact:** Non-compliant packaging causes customs issues.
**Engineering Impact:** Would need packaging rules.
**Recommended Decision:** Compliance must define packaging requirements.
**Owner:** Compliance

---

### Q148: What is the organic and certification premium pricing model?
**Status:** Not Answered
**Evidence:** Certifications can be stored but no premium pricing logic.
**Confidence:** High
**Reasoning:** No price adjustment for certified products.
**Risk Level:** Medium
**Business Impact:** Cannot monetize certification value.
**Engineering Impact:** Would need pricing rules.
**Recommended Decision:** Product must define certification pricing.
**Owner:** Product

---

### Q149: How will weather and climate risk be factored?
**Status:** Not Answered
**Evidence:** No climate risk logic, no weather integration.
**Confidence:** High
**Reasoning:** No risk scoring for weather events.
**Risk Level:** Medium
**Business Impact:** Agricultural trade is weather-dependent.
**Engineering Impact:** Would need weather data integration.
**Recommended Decision:** Product must decide if climate risk is in scope.
**Owner:** Product

---

### Q150: What is the political risk and country risk assessment?
**Status:** Not Answered
**Evidence:** No country risk data, no political risk scoring.
**Confidence:** High
**Reasoning:** No risk assessment for corridors.
**Risk Level:** High
**Business Impact:** Cannot warn users of high-risk corridors.
**Engineering Impact:** Would need risk data integration.
**Recommended Decision:** Executive must decide if political risk is needed.
**Owner:** Executive

---

*End of Question-by-Question Audit*
