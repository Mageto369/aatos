# Long-Term Memory

## AATOS Platform — Strategic Direction

### Current Status (as of 2026-08-09)
- Pilot readiness: **APPROVED** (with constraints)
- Commercial production readiness: **Not yet**
- Enterprise readiness: **Not yet**

### Pilot Constraints (Deliberately Scoped)
- Corridor: Kenya to U.S. only
- Commodity: Green coffee only
- Organizations: 20 maximum
- Payments: Sandbox only
- Compliance: Manual oversight

### The Shift
The fundamental question has changed from "Can we build this?" to "Will real buyers and sellers trust AATOS enough to move meaningful agricultural transactions through it?"

### Phase 4A: Live Pilot and Revenue Validation
**Goal:** Prove AATOS produces successful trade, not more software.

**Operating Targets:**
- 5 Kenyan suppliers
- 5 U.S. buyers
- 10 serious RFQs
- 20-30 quotations
- 3 accepted deals
- 1-3 completed commercial transactions

**Exit Gate:**
- At least one real commercial transaction completed
- At least three accepted deals
- At least ten qualified RFQs
- No critical authorization or compliance incident
- No unresolved payment reconciliation issue
- Full transaction audit trail
- Measured off-platform leakage
- Buyer and supplier feedback collected

**Key Metrics:**
- GMV
- Average transaction value
- RFQ-to-quotation rate
- Quotation-to-deal rate
- Time to first quotation
- Time from RFQ to accepted deal
- Compliance-document failure rate
- Manual interventions per transaction
- Steps completed outside AATOS
- Buyer repeat intent
- Supplier repeat intent
- Percentage of transaction completed inside AATOS

### Phase 4B: Commercialization (After Exit Gate)
1. Real payment integration (Stripe/Flutterwave — do NOT build escrow)
2. Email/transactional notifications (High priority)
3. Pilot analytics / operating dashboard
4. Document verification workflow (human-first, AI-assisted later)
5. Search: Keep PostgreSQL until proven insufficient
6. Mobile: Web-first, delay React Native
7. AI matching: After 100 transactions teach what matching means
8. Blockchain: Remove from current roadmap

### Reordered Priority Stack
1. Real payment integration
2. Email and transactional notifications
3. Pilot analytics / operating dashboard
4. Document verification (human workflow)
5. Search (PostgreSQL until volume demands)
6. Mobile web excellence
7. AI matching (evidence-driven)
8. Additional corridors (after Kenya proven)

### Critical Insight
Exit points (where users leave AATOS for WhatsApp, email, Excel, contracts) become the real roadmap. Record every exit point. Those define what to build next.
