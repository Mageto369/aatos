# AATOS Question Backlog

**Created:** 2026-08-04
**Methodology:** Impact × Urgency prioritization
**Sorted:** Highest score first

---

## Priority Formula

| Factor | Scale |
|---|---|
| Impact | 1-5 (minimal to business-critical) |
| Urgency | 1-5 (can defer to immediate blocker) |
| **Priority Score** | **Impact × Urgency** |

Thresholds:
- **P0:** Score = 25 (Critical — block pilot)
- **P1:** Score = 20-24 (High — block commercial MVP)
- **P2:** Score = 12-16 (Medium — block production)
- **P3:** Score = 4-9 (Low — block enterprise)

---

## P0 — Critical (Score = 25) — Block Pilot Launch

| ID | Question | Impact | Urgency | Score | Owner | Dependencies |
|---|---|---|---|---|---|---|
| Q37 | Which countries have full compliance rule sets? | 5 | 5 | 25 | Compliance | Q2 |
| Q38 | How are SPS requirements mapped per product per corridor? | 5 | 5 | 25 | Compliance | Q2, Q37 |
| Q50 | Who holds funds in escrow? | 5 | 5 | 25 | Executive | Q23 |
| Q105 | What jurisdiction governs platform terms? | 5 | 5 | 25 | Legal | — |
| Q106 | What is the platform's liability cap? | 5 | 5 | 25 | Legal | Q105 |
| Q109 | How are sanctions compliance checks performed? | 5 | 5 | 25 | Compliance | Q110 |
| Q110 | What is the AML/KYC framework? | 5 | 5 | 25 | Compliance | — |
| Q2 | Which corridors active at pilot launch? | 5 | 5 | 25 | Executive | — |

---

## P1 — High (Score = 20-24) — Block Commercial MVP

| ID | Question | Impact | Urgency | Score | Owner | Dependencies |
|---|---|---|---|---|---|---|
| Q1 | How many verified suppliers required per corridor? | 5 | 4 | 20 | Executive | Q2 |
| Q5 | What verification evidence per tier? | 5 | 4 | 20 | Compliance | Q6 |
| Q6 | Who verifies supplier documents? | 5 | 4 | 20 | Compliance | Q5 |
| Q7 | What is penalty/recourse for substandard product? | 5 | 4 | 20 | Legal | Q26 |
| Q12 | What commodities prioritized for pilot? | 5 | 4 | 20 | Executive | Q2 |
| Q22 | How is buyer creditworthiness assessed? | 5 | 4 | 20 | Finance | Q110 |
| Q23 | What payment terms supported? | 5 | 4 | 20 | Executive | Q50 |
| Q25 | How are buyer complaints handled? | 5 | 4 | 20 | Product | Q26 |
| Q26 | What is dispute resolution process? | 5 | 4 | 20 | Legal | Q105 |
| Q30 | What is platform liability if buyer doesn't pay? | 5 | 4 | 20 | Legal | Q105 |
| Q39 | Which certificates of origin accepted? | 5 | 4 | 20 | Compliance | Q2, Q37 |
| Q40 | How are trade agreements encoded? | 5 | 4 | 20 | Compliance | Q37 |
| Q42 | How are compliance violations flagged? | 5 | 4 | 20 | Compliance | Q37 |
| Q44 | How is customs tariff data sourced? | 5 | 4 | 20 | Compliance | Q37 |
| Q45 | What happens if shipment fails inspection? | 5 | 4 | 20 | Product | Q26 |
| Q46 | Are there banned/restricted product lists? | 5 | 4 | 20 | Compliance | Q37 |
| Q47 | How is compliance documentation authenticated? | 5 | 4 | 20 | Compliance | Q5 |
| Q53 | What is refund policy for cancelled deals? | 5 | 4 | 20 | Legal | Q26 |
| Q54 | How are chargebacks handled? | 5 | 4 | 20 | Finance | Q23 |
| Q55 | Are there financing products? | 5 | 4 | 20 | Executive | Q22 |
| Q57 | How are payment disputes resolved? | 5 | 4 | 20 | Legal | Q26 |
| Q61 | Which logistics partners integrated? | 5 | 4 | 20 | Executive | Q2 |
| Q72 | How is PII data protected? | 5 | 4 | 20 | Legal | Q111 |
| Q111 | How are GDPR/POPIA complied with? | 5 | 4 | 20 | Legal | Q105 |
| Q118 | What is runway in months? | 5 | 4 | 20 | Executive | — |

---

## P2 — Medium (Score = 12-16) — Block Production

| ID | Question | Impact | Urgency | Score | Owner | Dependencies |
|---|---|---|---|---|---|---|
| Q3 | Supplier onboarding funnel conversion target? | 4 | 4 | 16 | Product | Q1 |
| Q4 | Cost per supplier acquisition? | 4 | 4 | 16 | Finance | Q3 |
| Q8 | How are supplier quality scores calculated? | 4 | 4 | 16 | Product | — |
| Q9 | What happens to deals if supplier suspended? | 4 | 4 | 16 | Legal | Q7 |
| Q11 | Are cooperatives treated as single or collections? | 4 | 3 | 12 | Product | — |
| Q13 | How are seasonal fluctuations handled? | 4 | 3 | 12 | Product | — |
| Q16 | How are certifications validated? | 4 | 4 | 16 | Compliance | Q5 |
| Q17 | Max lead time from inquiry to quote? | 3 | 4 | 12 | Product | — |
| Q18 | Exclusive arrangements or open marketplace? | 4 | 4 | 16 | Executive | — |
| Q20 | Which buyer segments prioritized? | 4 | 4 | 16 | Product | Q2 |
| Q21 | Target buyer acquisition cost? | 4 | 3 | 12 | Finance | Q20 |
| Q24 | Minimum order value? | 4 | 3 | 12 | Product | Q49 |
| Q27 | Buyer verification tiers? | 4 | 3 | 12 | Compliance | Q5 |
| Q28 | Target buyer-to-supplier ratio? | 4 | 3 | 12 | Product | Q1, Q20 |
| Q31 | How are buyer preferences stored/matched? | 4 | 3 | 12 | Product | — |
| Q32 | What currencies supported? | 3 | 4 | 12 | Finance | Q52 |
| Q33 | How are shipping costs handled? | 4 | 4 | 16 | Product | Q61 |
| Q34 | Expected quote-to-deal conversion? | 4 | 3 | 12 | Product | — |
| Q35 | How are communications archived? | 4 | 3 | 12 | Compliance | Q111 |
| Q41 | Process for updating compliance rules? | 4 | 3 | 12 | Compliance | Q37 |
| Q43 | Corridor-specific document templates? | 4 | 3 | 12 | Product | Q37 |
| Q48 | Compliance SLA per corridor? | 3 | 3 | 9 | Product | Q37 |
| Q49 | Platform fee structure? | 3 | 3 | 9 | Finance | — |
| Q51 | What payment providers integrated? | 4 | 4 | 16 | Engineering | Q23 |
| Q52 | Multi-currency conversions? | 4 | 3 | 12 | Finance | Q32 |
| Q56 | Revenue model beyond transaction fees? | 4 | 3 | 12 | Executive | Q49 |
| Q58 | FX hedging arrangements? | 4 | 2 | 8 | Finance | Q52 |
| Q59 | Revenue recognition? | 3 | 3 | 9 | Finance | Q49 |
| Q60 | Capital requirement for float/escrow? | 4 | 3 | 12 | Finance | Q50 |
| Q62 | How are shipping quotes obtained? | 4 | 3 | 12 | Product | Q61 |
| Q63 | What Incoterms supported? | 3 | 3 | 9 | Product | — |
| Q64 | Cargo insurance handling? | 4 | 3 | 12 | Executive | Q61 |
| Q65 | Cold chain requirements? | 3 | 3 | 9 | Product | Q61 |
| Q66 | What happens if shipment delayed? | 4 | 3 | 12 | Product | Q61 |
| Q67 | Proof of delivery verification? | 4 | 3 | 12 | Product | Q61 |
| Q68 | Warehouse/storage integrations? | 3 | 3 | 9 | Product | — |
| Q69 | Target user load for pilot? | 3 | 3 | 9 | Engineering | — |
| Q70 | Uptime SLA? | 3 | 3 | 9 | Engineering | — |
| Q71 | Disaster recovery plan? | 5 | 3 | 15 | Engineering | — |
| Q73 | Data retention policy? | 4 | 3 | 12 | Legal | Q111 |
| Q74 | API rate limits? | 3 | 3 | 9 | Engineering | — |
| Q75 | Mobile app roadmap? | 4 | 3 | 12 | Product | — |
| Q77 | Analytics and reporting? | 4 | 3 | 12 | Product | — |
| Q78 | Search implementation? | 3 | 2 | 6 | Engineering | — |
| Q79 | CI/CD pipeline? | 3 | 3 | 9 | Engineering | — |
| Q80 | Database migrations? | 5 | 3 | 15 | Engineering | — |
| Q81 | Testing coverage? | 5 | 3 | 15 | Engineering | — |
| Q82 | Feature flagging? | 3 | 2 | 6 | Engineering | — |
| Q84 | Errors handled and logged? | 3 | 3 | 9 | Engineering | — |
| Q95 | Direct competitors? | 4 | 3 | 12 | Marketing | — |
| Q96 | Unique value proposition? | 4 | 3 | 12 | Product | Q95 |
| Q97 | Go-to-market strategy? | 5 | 4 | 20 | Executive | — |
| Q98 | Customer acquisition strategy? | 5 | 4 | 20 | Marketing | Q97 |
| Q99 | Partnerships in place/planned? | 4 | 3 | 12 | Executive | — |
| Q100 | Enterprise pricing? | 4 | 3 | 12 | Executive | Q56 |
| Q101 | Churn definition? | 3 | 2 | 6 | Product | — |
| Q102 | Net revenue retention target? | 3 | 2 | 6 | Finance | — |
| Q103 | Expansion revenue strategy? | 3 | 2 | 6 | Executive | Q56 |
| Q104 | Product-market fit measurement? | 5 | 4 | 20 | Product | Q77 |
| Q108 | Insurance platform carries? | 4 | 3 | 12 | Executive | Q105 |
| Q112 | Dispute resolution mechanism? | 5 | 4 | 20 | Legal | Q105 |
| Q113 | Force majeure handling? | 3 | 3 | 9 | Legal | Q105 |
| Q114 | Subcontractor liability chain? | 4 | 3 | 12 | Legal | Q61 |
| Q115 | CAC payback period? | 3 | 2 | 6 | Finance | Q4 |
| Q116 | Gross margin per transaction? | 4 | 3 | 12 | Finance | Q49 |
| Q117 | Monthly burn rate? | 5 | 4 | 20 | Finance | Q118 |
| Q119 | Break-even transaction volume? | 4 | 3 | 12 | Finance | Q116 |
| Q120 | Target NPS? | 3 | 2 | 6 | Product | — |
| Q121 | Support ticket resolution time? | 3 | 2 | 6 | Product | — |
| Q122 | Fraud detection? | 5 | 4 | 20 | Compliance | Q110 |
| Q124 | Platform health monitoring? | 3 | 3 | 9 | Engineering | — |
| Q125 | 3-year revenue target? | 5 | 3 | 15 | Executive | — |
| Q126 | Year 2 markets? | 4 | 2 | 8 | Executive | Q2 |
| Q127 | Fundraising strategy? | 5 | 4 | 20 | Executive | Q118 |
| Q128 | Exit strategy? | 3 | 2 | 6 | Executive | — |
| Q129 | Defensibility moat? | 4 | 3 | 12 | Executive | Q96 |
| Q130 | Data monetization? | 3 | 2 | 6 | Executive | — |
| Q131 | Commodity price volatility? | 4 | 3 | 12 | Product | — |
| Q132 | Blockchain strategy? | 3 | 2 | 6 | Executive | — |
| Q133 | AI/ML for matching? | 3 | 2 | 6 | Product | — |
| Q134 | API partner ecosystem? | 3 | 2 | 6 | Executive | — |
| Q135 | Government trade system integration? | 3 | 2 | 6 | Executive | — |
| Q136 | White-label strategy? | 3 | 2 | 6 | Executive | — |
| Q137 | Sustainability reporting? | 3 | 2 | 6 | Product | — |
| Q138 | Farmer direct-to-buyer strategy? | 4 | 3 | 12 | Product | Q11 |
| Q139 | Cooperative management? | 4 | 3 | 12 | Product | Q11 |
| Q140 | Traceability strategy? | 4 | 3 | 12 | Product | — |
| Q141 | Quality grading standardization? | 4 | 3 | 12 | Compliance | Q16 |
| Q142 | Sample/trial shipment workflow? | 3 | 2 | 6 | Product | — |
| Q143 | Containerization/bulk shipping? | 3 | 2 | 6 | Product | Q61 |
| Q144 | Warehousing/inventory strategy? | 3 | 2 | 6 | Product | — |
| Q145 | Last-mile delivery? | 2 | 2 | 4 | Product | Q61 |
| Q146 | Returns/rejections workflow? | 4 | 3 | 12 | Product | Q26 |
| Q147 | Packaging/labeling enforcement? | 3 | 2 | 6 | Compliance | Q37 |
| Q148 | Certification premium pricing? | 3 | 2 | 6 | Product | Q16 |
| Q149 | Weather/climate risk? | 3 | 2 | 6 | Product | — |
| Q150 | Political risk assessment? | 3 | 2 | 6 | Executive | Q2 |

---

## Backlog Summary by Status

| Status | Count | Percentage |
|---|---|---|
| Not Answered | 115 | 76.7% |
| Partially Answered | 29 | 19.3% |
| Contradicted | 3 | 2.0% |
| Answered | 3 | 2.0% |
| **Total** | **150** | **100%** |

---

## Backlog Summary by Priority

| Priority | Count | Blocker For |
|---|---|---|
| P0 — Critical | 8 | Pilot launch |
| P1 — High | 25 | Commercial MVP |
| P2 — Medium | 117 | Production / Enterprise |

---

*End of Question Backlog*
