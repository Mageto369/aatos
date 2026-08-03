# AATOS Decision Register

**Created:** 2026-08-04
**Source:** Repository Audit against MASTER_QUESTIONER.md
**Status:** PENDING — All decisions require executive action

---

## How to Use This Register

Each entry is a decision the company does not currently have documented evidence for.
Priority is derived from Risk Level + Business Impact.
Owner is the role that must make the decision.

---

## Critical Decisions (Make Before Pilot)

### D001: Corridor Commitment
**Question:** Q2 — Which corridors will be active at pilot launch?
**Risk:** Critical
**Owner:** Executive
**Context:** No corridor list exists. Compliance rules, localization, marketing, and supplier acquisition all depend on this.
**Options:**
1. Commit to 1-3 corridors (e.g., Ghana→EU, Kenya→UAE, Nigeria→UK)
2. Launch corridor-agnostic and build rules on demand
3. Defer pilot until corridor analysis complete
**Recommended:** Option 1. Corridor-agnostic launch without rules is dangerous.

---

### D002: Verification Model
**Question:** Q5, Q6 — What evidence per tier? Who verifies?
**Risk:** Critical
**Owner:** Compliance / Executive
**Context:** `verification_level` enum exists but no enforcement. No verifier identified.
**Options:**
1. Manual review by AATOS staff
2. API integration (Onfido, Smile Identity, Jumio)
3. Hybrid: automated + spot-check
4. Defer verification to v2
**Recommended:** Option 3. Start with manual, automate as scale demands.

---

### D003: Escrow Reality
**Question:** Q50 — Who holds funds? Architecture claims escrow. Code simulates it.
**Risk:** Critical
**Owner:** Executive / Engineering
**Context:** `payments.service.ts` line 156: "In production: trigger Flutterwave transfer to payee" — but no production code exists.
**Options:**
1. Implement real Flutterwave subaccount escrow
2. Partner with dedicated escrow provider (Tradeshift, Tazapay)
3. Remove escrow claims and operate as payment facilitator only
4. Build custom escrow
**Recommended:** Option 2. Faster to market, lower risk than custom build.

---

### D004: Dispute Resolution
**Question:** Q25, Q26, Q57, Q112 — How are disputes resolved?
**Risk:** Critical
**Owner:** Legal / Product
**Context:** No dispute entity, no workflow, no liability framework.
**Options:**
1. Platform-mediated arbitration
2. Third-party dispute resolution service
3. Buyer/seller resolve offline, platform not liable
4. Automated resolution based on milestone + inspection data
**Recommended:** Option 1 for pilot, with clear terms limiting platform liability.

---

### D005: Payment Terms
**Question:** Q23 — What payment terms are supported?
**Risk:** Critical
**Owner:** Executive / Finance
**Context:** Only Flutterwave card payments. No LC, no open account, no trade finance.
**Options:**
1. Add LC integration (bank partner required)
2. Add open account with credit scoring
3. Keep Flutterwave only for pilot, expand post-pilot
4. Build trade finance product
**Recommended:** Option 3 for pilot if corridor is intra-African or small-value. Option 1 required for EU/US buyers.

---

### D006: Trade Finance
**Question:** Q22, Q55 — Is trade finance in pilot scope?
**Risk:** Critical
**Owner:** Executive
**Context:** `org_type` has `trade_finance` but no module exists.
**Options:**
1. Partner with bank for PO financing
2. Build in-house lending (requires license)
3. Defer to v2
4. Refer to third-party financiers
**Recommended:** Option 4 for pilot. Referral model requires no license.

---

### D007: Compliance Rule Population
**Question:** Q37, Q38, Q39 — Which rules exist? Who maintains them?
**Risk:** Critical
**Owner:** Compliance / Executive
**Context:** Schema supports rules. No data. No SPS rules. No certificate rules.
**Options:**
1. Hire compliance analyst to populate rules
2. License compliance database (e.g., Thomson Reuters, Descartes)
3. Partner with customs brokers for rule feeds
4. Build rules reactively as trades occur
**Recommended:** Option 2 + 3. License data for major corridors, supplement with broker expertise.

---

### D008: Terms of Service & Jurisdiction
**Question:** Q105, Q106 — What jurisdiction? What liability cap?
**Risk:** Critical
**Owner:** Legal
**Context:** No legal documents exist in repository.
**Options:**
1. English law (common, arbitration-friendly)
2. Delaware law (US investor familiarity)
3. Local law of primary market (e.g., Ghana, Kenya)
4. Singapore law (neutral, trade-friendly)
**Recommended:** Option 4 for international trades. Local counsel for each pilot market.

---

### D009: AML/KYC Framework
**Question:** Q110 — What is the AML/KYC framework?
**Risk:** Critical
**Owner:** Compliance / Legal
**Context:** No KYC logic. Payments flow through Flutterwave (which has its own KYC) but platform has none.
**Options:**
1. Rely on Flutterwave KYC (insufficient for platform liability)
2. Implement tiered KYC (self-declared → document → enhanced)
3. Partner with KYC provider
4. Defer until regulatory requirement
**Recommended:** Option 2. Minimum viable for pilot.

---

### D010: Data Protection Compliance
**Question:** Q72, Q73, Q111 — GDPR, POPIA compliance?
**Risk:** Critical
**Owner:** Legal / Engineering
**Context:** No privacy policy. No DPO. No consent management.
**Options:**
1. Full GDPR/POPIA compliance before pilot
2. Compliance by design with 90-day remediation plan
3. Pilot in non-regulated market first
4. Rely on terms of service (insufficient)
**Recommended:** Option 2. Implement privacy framework during pilot, full compliance before commercial launch.

---

## High-Priority Decisions (Make Before Commercial MVP)

### D011: Revenue Model
**Question:** Q49, Q56, Q100 — Beyond 1% transaction fee?
**Risk:** High
**Owner:** Executive / Finance
**Options:**
1. Subscription tiers (free, pro, enterprise)
2. Premium features (priority matching, analytics, API access)
3. Trade finance commission
4. Data/licensing revenue
**Recommended:** Option 2 + 3. Subscription reduces reliance on transaction volume.

---

### D012: Supplier Target Numbers
**Question:** Q1 — How many suppliers per corridor for launch?
**Risk:** Critical
**Owner:** Executive / Product
**Options:**
1. 50 verified suppliers per corridor
2. 200 registered, 50 verified
3. 10 anchor suppliers (quality over quantity)
4. Launch with any number and grow organically
**Recommended:** Option 3. Anchor suppliers reduce matching risk.

---

### D013: Commodity Prioritization
**Question:** Q12 — Which commodities for pilot?
**Risk:** High
**Owner:** Executive / Product
**Context:** DEV_STATUS mentions cocoa, coffee, cashew, sesame.
**Options:**
1. Cocoa (Ghana/Cote d'Ivoire → EU)
2. Coffee (Kenya/Ethiopia → UAE/EU)
3. Cashew (Nigeria/Ghana → India/Vietnam)
4. Sesame (Niger/Sudan → Turkey/China)
**Recommended:** Select 2. Cocoa + Coffee have strong demand and established compliance pathways.

---

### D014: Logistics Strategy
**Question:** Q61, Q62, Q64 — Which logistics partners? How are quotes obtained?
**Risk:** High
**Owner:** Executive / Product
**Options:**
1. Integrate freight APIs (Freightos, Xeneta)
2. Partner with freight forwarders (Maersk, DHL)
3. Manual logistics (buyer/supplier arrange separately)
4. Build logistics marketplace
**Recommended:** Option 3 for pilot. Add logistics integration in v2.

---

### D015: Buyer Segmentation
**Question:** Q20 — Which buyer segments are prioritized?
**Risk:** High
**Owner:** Product / Executive
**Options:**
1. Importers/processors (high volume, repeat)
2. Retailers (smaller, more numerous)
3. Manufacturers (specific commodity needs)
4. Traders (highest volume, lowest loyalty)
**Recommended:** Option 1. Importers/processors offer volume and repeat business.

---

### D016: Certification Validation
**Question:** Q16 — How are certifications validated?
**Risk:** High
**Owner:** Compliance / Engineering
**Options:**
1. Manual verification by AATOS team
2. API integration with certifying bodies (Rainforest Alliance, Fairtrade)
3. Third-party verification service
4. Honor system with spot checks
**Recommended:** Option 2 for major certs, Option 4 for pilot with manual spot checks.

---

### D017: Insurance
**Question:** Q64 — Cargo insurance handling?
**Risk:** High
**Owner:** Executive
**Options:**
1. Integrate with insurer (Lloyd's, local underwriters)
2. Require buyers to arrange own insurance
3. Platform-arranged insurance (requires license)
4. Include insurance in logistics partner offering
**Recommended:** Option 2 for pilot. Platform recommends but does not arrange.

---

### D018: Marketplace vs. Managed Model
**Question:** Q18 — Exclusive arrangements or open marketplace?
**Risk:** High
**Owner:** Executive
**Options:**
1. Open marketplace (any supplier, any buyer)
2. Curated marketplace (verified only)
3. Managed trade (AATOS brokers every deal)
4. Hybrid: curated for pilot, open later
**Recommended:** Option 4. Curated for trust, open for scale.

---

### D019: Runway & Fundraising
**Question:** Q117, Q118, Q127 — Burn rate, runway, fundraising?
**Risk:** Critical
**Owner:** Executive / Finance
**Context:** No financial data in repository.
**Options:**
1. Disclose runway to leadership team
2. Secure bridge funding if <6 months
3. Reduce burn to extend runway
4. Begin fundraising immediately if <12 months
**Recommended:** Immediate disclosure and planning required.

---

### D020: Competitive Positioning
**Question:** Q95, Q96, Q129 — Competitors? UVP? Moat?
**Risk:** High
**Owner:** Executive / Product
**Options:**
1. Compete on compliance automation
2. Compete on payment/escrow
3. Compete on supplier verification
4. Compete on data/analytics
**Recommended:** Option 1 + 3. Compliance + verification are hardest to replicate.

---

## Medium-Priority Decisions (Make Before Production)

### D021: Mobile Strategy
**Question:** Q75 — Mobile app scope and timeline?
**Risk:** Medium
**Owner:** Product / Engineering
**Options:**
1. Full React Native app
2. PWA (progressive web app)
3. Mobile-responsive web only
4. Defer mobile to v2
**Recommended:** Option 2 for pilot. Faster, cheaper, adequate for MVP.

---

### D022: Analytics & Reporting
**Question:** Q77 — What analytics exist?
**Risk:** Medium
**Owner:** Product / Engineering
**Options:**
1. Full BI stack (Metabase, Grafana)
2. Event tracking (Segment, Mixpanel)
3. Custom analytics
4. Defer to v2
**Recommended:** Option 2 for pilot. Essential for PMF measurement.

---

### D023: Feature Flagging
**Question:** Q82 — How are feature flags handled?
**Risk:** Medium
**Owner:** Engineering
**Options:**
1. LaunchDarkly/Unleash
2. Custom flag system
3. Environment variables
4. Defer to v2
**Recommended:** Option 3 for pilot. Upgrade to Option 1 before production.

---

### D024: Testing Strategy
**Question:** Q81 — DEV_STATUS claims tests exist. None found.
**Risk:** Critical
**Owner:** Engineering
**Options:**
1. Write comprehensive test suite before pilot
2. Write tests for critical paths only
3. Remove claim from DEV_STATUS and test later
4. Manual QA only for pilot
**Recommended:** Option 2. Cover auth, payments, deals. Expand post-pilot.

---

### D025: Database Migration Strategy
**Question:** Q80 — `synchronize: true` in production is dangerous.
**Risk:** Critical
**Owner:** Engineering
**Options:**
1. Implement TypeORM migrations immediately
2. Use Flyway/Liquibase
3. Keep synchronize for pilot only
4. Manual schema management
**Recommended:** Option 1 immediately. Before any production data.

---


## D026: Pilot Scope — Kenya→United States Green Coffee
**Date:** 2026-08-04
**Decider:** Executive
**Status:** APPROVED

### Decision
The initial AATOS pilot is limited to:
- **Corridor:** Kenya → United States
- **Commodity:** Green specialty coffee (unroasted only)
- **Target:** 5 verified Kenyan suppliers, 5 verified U.S. buyers, maximum 20 participating organizations
- **Duration:** 90 days
- **Success criterion:** At least one completed commercial transaction

### Scope Inclusions
- Supplier and buyer verification
- Structured product information for green coffee
- RFQs, quotations, negotiation records, deals, contracts
- Compliance checklists for Kenya→U.S. green coffee
- Document management, inspection coordination, payment milestone tracking, audit records

### Scope Exclusions
- Roasted coffee, instant coffee, extracts, flavored coffee, retail-ready products
- Unverified organic or sustainability claims
- Acting as importer of record
- Issuing government certifications
- Providing legal approval
- Holding customer funds without licensed provider
- Guaranteeing product quality or transaction completion

### Responsibilities
- Seller: accurate product and export information
- Buyer or appointed representative: importer-of-record obligations
- Licensed third parties: regulated payments, inspections, laboratories, customs brokerage

### Consequences
- Unblocks compliance rule population for Kenya→U.S. green coffee
- Unblocks supplier and buyer recruitment targeting
- Unblocks product workflow design for green coffee sourcing
- Defers all other corridors and commodities until Phase 1 gate cleared

### Dependencies
This decision enables:
- D001 (Corridor Commitment) — resolved
- D012 (Supplier Targets) — resolved
- D013 (Commodity Prioritization) — resolved
- D007 (Compliance Rules) — now has specific target corridor
- D014 (Logistics Strategy) — manual logistics acceptable for pilot
- D015 (Buyer Segmentation) — U.S. coffee importers, roasters, distributors

