# AATOS — Entity Relationship Model

## 1. Executive Summary

This document provides a comprehensive reference for the AATOS data model. It describes all core entities, their relationships, cardinality, and business rules. This is the canonical reference for database schema, API design, and frontend state management.

## 2. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AATOS DATA MODEL                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐                    │
│  │   users     │◄──────┤organization_│──────►│organizations│                    │
│  │             │       │   members   │       │             │                    │
│  └─────────────┘       └─────────────┘       │ • profile    │                    │
│                                              │ • verification│                   │
│  ┌─────────────┐       ┌─────────────┐       │ • capacity   │                    │
│  │  documents  │◄──────┤    orgs     │       │ • scores     │                    │
│  │  (vault)    │       │             │       └──────┬──────┘                    │
│  └─────────────┘       └─────────────┘              │                            │
│                                                     │                            │
│  ┌─────────────┐       ┌─────────────┐              │                            │
│  │   products  │◄──────┤     orgs    │              │                            │
│  │             │       │             │              │                            │
│  │ • attributes│       │ • listings  │              │                            │
│  │ • pricing   │       │ • inventory │              │                            │
│  │ • compliance│       │             │              │                            │
│  └──────┬──────┘       └─────────────┘              │                            │
│         │                                           │                            │
│         │         ┌─────────────┐                   │                            │
│         └────────►│product_categ│                   │                            │
│                   │   ories     │                   │                            │
│                   │ • taxonomy  │                   │                            │
│                   │ • schemas   │                   │                            │
│                   └─────────────┘                   │                            │
│                                                     │                            │
│  ┌─────────────┐       ┌─────────────┐       ┌─────▼─────┐                      │
│  │    rfqs     │◄──────┤  quotations │◄──────┤   deals   │                      │
│  │             │       │             │       │           │                      │
│  │ • buyer req │       │ • supplier  │       │ • deal    │                      │
│  │ • matching  │       │   response  │       │   room    │                      │
│  └──────┬──────┘       └─────────────┘       │ • milestones                     │
│         │                                     │ • payments  │                    │
│         │         ┌─────────────┐            │ • contracts │                    │
│         └────────►│  messages   │◄───────────┤ • logistics │                    │
│                   │             │            └─────┬──────┘                    │
│                   │ • real-time │                  │                            │
│                   │ • threaded  │                  │                            │
│                   └─────────────┘            ┌─────▼─────┐                      │
│                                              │  payments │                      │
│  ┌─────────────┐       ┌─────────────┐      │           │                      │
│  │ inspections │◄──────┤   deals     │◄─────┤ • escrow  │                      │
│  │             │       │             │      │ • milestones                     │
│  │ • booking   │       │ • quality   │      └───────────┘                      │
│  │ • evidence  │       │ • evidence  │                                       │
│  │ • reports   │       │             │                                       │
│  └─────────────┘       └─────────────┘                                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                        COMPLIANCE ENGINE                             │     │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │     │
│  │  │   rules     │────►│ checklists  │────►│   items     │            │     │
│  │  │             │     │             │     │             │            │     │
│  │  │ • corridor  │     │ • per deal  │     │ • status    │            │     │
│  │  │ • product   │     │ • per rfq   │     │ • evidence  │            │     │
│  │  │ • versioned │     │ • per product│     │ • timeline  │            │     │
│  │  └─────────────┘     └─────────────┘     └─────────────┘            │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │  service_   │◄──────┤   orgs      │       │ audit_logs  │               │
│  │  providers  │       │             │       │             │               │
│  │             │       │ • directory │       │ • immutable │               │
│  │ • services  │       │ • ratings   │       │ • append-only│              │
│  │ • coverage  │       │ • performance│      │ • searchable│               │
│  └─────────────┘       └─────────────┘       └─────────────┘               │
│                                                                               │
│  ┌─────────────┐       ┌─────────────┐                                     │
│  │notifications│       │   users     │                                     │
│  │             │◄──────┤             │                                     │
│  │ • multi-channel    │             │                                     │
│  │ • entity-linked    │             │                                     │
│  └─────────────┘       └─────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. Entity Definitions

### 3.1 organizations
**Purpose:** Canonical entity for all platform participants

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| name | CITEXT | 1 | Display name |
| legal_name | CITEXT | 0..1 | Registered legal name |
| type | org_type | 1 | Role in ecosystem |
| status | org_status | 1 | Platform lifecycle status |
| verification_level | verification_level | 1 | Current verification tier |
| country_code | CHAR(2) | 1 | Primary country |
| trust_score | SMALLINT | 1 | 0-100 computed score |
| risk_score | SMALLINT | 1 | 0-100 computed score |
| profile_completeness | SMALLINT | 1 | 0-100 percentage |

**Relationships:**
- `users` → `organization_members` (1:N) Organization has many members
- `products` (1:N) Organization lists many products
- `deals` as buyer (1:N) Organization buys in many deals
- `deals` as supplier (1:N) Organization sells in many deals
- `documents` (1:N) Organization owns many documents
- `rfqs` as buyer (1:N) Organization publishes many RFQs
- `quotations` as supplier (1:N) Organization submits many quotes

**Business Rules:**
- Registration number must be unique within country_code
- Verification level advances through sequential tiers
- Trust score computed from verified deals, inspection history, documentation quality
- Soft delete preserves all related records for audit

---

### 3.2 users
**Purpose:** Individual human accounts with authentication credentials

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| email | CITEXT | 1 | Unique login identifier |
| email_verified | BOOLEAN | 1 | Email confirmation status |
| phone | VARCHAR(30) | 0..1 | Mobile number |
| first_name | VARCHAR(100) | 1 | Given name |
| last_name | VARCHAR(100) | 1 | Family name |
| status | user_status | 1 | Account lifecycle |
| mfa_enabled | BOOLEAN | 1 | Multi-factor auth status |

**Relationships:**
- `organizations` → `organization_members` (N:M) User belongs to many organizations
- `messages` (1:N) User sends many messages
- `audit_logs` (1:N) User performs many actions

**Business Rules:**
- Email must be unique across platform
- Phone verification required for high-value transactions
- MFA required for organization owners and admins
- Account lockout after 5 failed login attempts

---

### 3.3 products
**Purpose:** Supplier product listings with category-specific attributes

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| organization_id | UUID | 1 | Owning supplier |
| category_id | UUID | 1 | Product taxonomy node |
| title | VARCHAR(255) | 1 | Listing headline |
| attributes | JSONB | 1 | Category-specific fields |
| origin_country | CHAR(2) | 1 | Source country |
| available_quantity | DECIMAL(18,4) | 1 | Current stock |
| price_fob | DECIMAL(18,4) | 0..1 | FOB price per unit |
| price_cif | DECIMAL(18,4) | 0..1 | CIF price per unit |
| status | product_status | 1 | Listing lifecycle |
| compliance_score | SMALLINT | 1 | 0-100 readiness score |

**Relationships:**
- `organizations` (N:1) Product belongs to one supplier
- `product_categories` (N:1) Product has one category
- `quotations` (1:N) Product referenced in many quotes
- `documents` (N:M via lab_report_id) Product linked to lab reports

**Business Rules:**
- Attributes validated against category JSON Schema
- Price must be positive if provided
- Compliance score auto-computed from linked documents and category rules
- Published listings require minimum profile completeness
- Soft delete preserves listing history for deals

---

### 3.4 product_categories
**Purpose:** Hierarchical commodity taxonomy with attribute schemas

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| parent_id | UUID | 0..1 | Parent category (tree) |
| group_type | product_category_group | 1 | Top-level grouping |
| name | VARCHAR(100) | 1 | Human-readable name |
| slug | VARCHAR(100) | 1 | URL identifier |
| code | VARCHAR(20) | 1 | Machine code (e.g. COF-ARAB) |
| attribute_schema | JSONB | 1 | JSON Schema for validation |
| hs_code | VARCHAR(20) | 0..1 | Harmonized System code |

**Relationships:**
- `parent_id` self-reference (N:1) Child categories have one parent
- `product_category_attributes` (1:N) Category defines many attributes
- `products` (1:N) Category has many product listings
- `compliance_rules` (1:N) Category referenced in many rules

**Business Rules:**
- Slug and code must be unique
- Attribute schema must be valid JSON Schema
- Category tree depth limited to 4 levels
- Inactive categories hide associated products

---

### 3.5 rfqs (Request for Quotation)
**Purpose:** Buyer sourcing requirements published to supplier network

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| buyer_org_id | UUID | 1 | Publishing buyer |
| product_category_id | UUID | 1 | Required product type |
| specifications | JSONB | 1 | Structured requirements |
| required_quantity | DECIMAL(18,4) | 1 | Needed volume |
| destination_country | CHAR(2) | 1 | Delivery destination |
| response_deadline | TIMESTAMPTZ | 1 | Quote submission cutoff |
| status | rfq_status | 1 | Lifecycle status |
| is_public | BOOLEAN | 1 | Visibility scope |

**Relationships:**
- `organizations` as buyer (N:1) RFQ published by one buyer
- `quotations` (1:N) RFQ receives many quotes
- `deals` (1:0..1) RFQ may result in one deal
- `messages` (1:N) RFQ may have associated messages

**Business Rules:**
- Response deadline must be in future
- Public RFQs visible to all matched suppliers
- Private RFQs only visible to invited suppliers
- Expired RFQs automatically close
- Buyer can award at most one deal per RFQ

---

### 3.6 quotations
**Purpose:** Supplier formal response to buyer RFQ

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| rfq_id | UUID | 1 | Parent RFQ |
| supplier_org_id | UUID | 1 | Quoting supplier |
| product_id | UUID | 0..1 | Specific product referenced |
| unit_price | DECIMAL(18,4) | 1 | Price per unit |
| total_price | DECIMAL(18,4) | 1 | Total quote value |
| incoterm | incoterm | 1 | Delivery terms |
| validity_days | INTEGER | 1 | Quote expiration |
| status | quotation_status | 1 | Quote lifecycle |

**Relationships:**
- `rfqs` (N:1) Quote responds to one RFQ
- `organizations` as supplier (N:1) Quote submitted by one supplier
- `products` (N:0..1) Quote may reference one product
- `deals` (1:0..1) Quote may become winning quote in one deal

**Business Rules:**
- Price must be positive
- Validity period defaults to 30 days
- Accepted quote transitions to deal creation
- Rejected quotes remain visible for history
- Expired quotes cannot be accepted

---

### 3.7 deals (Deal Rooms)
**Purpose:** Core transaction entity coordinating full commercial journey

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| buyer_org_id | UUID | 1 | Buying organization |
| supplier_org_id | UUID | 1 | Selling organization |
| rfq_id | UUID | 0..1 | Originating RFQ |
| winning_quotation_id | UUID | 0..1 | Accepted quote |
| title | VARCHAR(255) | 1 | Deal name |
| agreed_quantity | DECIMAL(18,4) | 1 | Contracted volume |
| agreed_price | DECIMAL(18,4) | 1 | Contracted price |
| status | deal_status | 1 | Pipeline position |
| total_value_usd | DECIMAL(18,4) | 1 | Computed deal value |
| contract_document_id | UUID | 0..1 | Signed contract |

**Relationships:**
- `organizations` as buyer (N:1) Deal has one buyer
- `organizations` as supplier (N:1) Deal has one supplier
- `rfqs` (N:0..1) Deal may originate from one RFQ
- `quotations` (N:0..1) Deal may be based on one quote
- `deal_milestones` (1:N) Deal has many milestones
- `messages` (1:N) Deal contains many messages
- `payments` (1:N) Deal has many payment records
- `inspections` (1:N) Deal has many inspections
- `compliance_checklists` (1:0..1) Deal has one checklist
- `documents` (N:M) Deal references many documents

**Business Rules:**
- Buyer and supplier must be different organizations
- Status transitions follow strict pipeline (no skipping)
- Total value computed from quantity × price
- Platform fee calculated as percentage of total value
- Soft delete only for draft/negotiating deals

---

### 3.8 deal_milestones
**Purpose:** Trackable checkpoints within a deal lifecycle

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| deal_id | UUID | 1 | Parent deal |
| milestone_type | milestone_type | 1 | Checkpoint type |
| sequence_order | INTEGER | 1 | Position in pipeline |
| status | milestone_status | 1 | Current state |
| scheduled_date | DATE | 0..1 | Planned completion |
| completed_at | TIMESTAMPTZ | 0..1 | Actual completion |
| payment_amount | DECIMAL(18,4) | 0..1 | Linked payment value |

**Relationships:**
- `deals` (N:1) Milestone belongs to one deal
- `documents` (N:0..1) Milestone may have evidence document
- `payments` (N:0..1) Milestone may trigger payment

**Business Rules:**
- Sequence order must be unique within deal
- Previous milestone must be completed before next activates
- Payment milestones require amount and currency
- Completed milestones cannot be reverted (immutable)
- Overdue milestones trigger escalation alerts

---

### 3.9 payments
**Purpose:** Financial transaction records linked to escrow/partner systems

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| deal_id | UUID | 1 | Parent deal |
| milestone_id | UUID | 0..1 | Triggering milestone |
| payer_org_id | UUID | 1 | Paying party |
| payee_org_id | UUID | 1 | Receiving party |
| amount | DECIMAL(18,4) | 1 | Transaction amount |
| currency | currency_code | 1 | Transaction currency |
| payment_method | payment_method | 1 | Payment mechanism |
| status | payment_status | 1 | Transaction state |
| external_reference | VARCHAR(255) | 0..1 | Partner transaction ID |

**Relationships:**
- `deals` (N:1) Payment belongs to one deal
- `deal_milestones` (N:0..1) Payment linked to one milestone
- `organizations` as payer (N:1) Payment sent by one org
- `organizations` as payee (N:1) Payment received by one org

**Business Rules:**
- Amount must be positive
- Payer and payee must be different organizations
- Status transitions: pending → held → released/refunded/failed
- External reference required for non-manual payments
- Platform fee deducted from payment amount

---

### 3.10 messages
**Purpose:** Communication thread within deal or RFQ context

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| deal_id | UUID | 0..1 | Deal context |
| rfq_id | UUID | 0..1 | RFQ context |
| sender_org_id | UUID | 1 | Sending organization |
| sender_user_id | UUID | 1 | Sending user |
| content | TEXT | 1 | Message body |
| original_language | VARCHAR(10) | 1 | Source language |
| translated_content | JSONB | 0..1 | Translations |

**Relationships:**
- `deals` (N:0..1) Message may be in one deal
- `rfqs` (N:0..1) Message may be in one RFQ
- `organizations` as sender (N:1) Message sent by one org
- `users` as sender (N:1) Message sent by one user
- `documents` (N:0..1) Message may have attachment

**Business Rules:**
- Either deal_id or rfq_id must be set (not both, not neither)
- Sender must be member of sender_org_id
- Content max 10,000 characters
- Edited messages preserve original content in audit
- Deleted messages soft-delete with audit trail

---

### 3.11 compliance_rules
**Purpose:** Source-linked, versioned trade compliance requirements

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| origin_country | CHAR(2) | 1 | Source country |
| destination_country | CHAR(2) | 1 | Target country |
| product_category_id | UUID | 0..1 | Specific category |
| requirement_type | compliance_requirement_type | 1 | Type of requirement |
| requirement | TEXT | 1 | Human-readable requirement |
| responsible_party | VARCHAR(50) | 1 | Who must fulfill |
| rule_version | INTEGER | 1 | Version number |
| rule_status | VARCHAR(20) | 1 | active/under_review/retired |

**Relationships:**
- `product_categories` (N:0..1) Rule may apply to one category
- `compliance_checklists` (1:N) Rules generate many checklist items

**Business Rules:**
- Version unique within origin×destination×category×requirement
- Only active rules used for new checklist generation
- Retired rules preserved for historical checklists
- Source URL required for all rules
- Reviewed at least quarterly

---

### 3.12 documents
**Purpose:** Centralized document vault with AI extraction

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| organization_id | UUID | 1 | Owning organization |
| uploaded_by_user_id | UUID | 1 | Uploader |
| type | document_type | 1 | Document classification |
| status | document_status | 1 | Processing lifecycle |
| title | VARCHAR(255) | 1 | Display name |
| storage_key | VARCHAR(500) | 1 | S3 object key |
| extracted_data | JSONB | 0..1 | AI-extracted fields |
| expiry_date | DATE | 0..1 | Validity expiration |

**Relationships:**
- `organizations` (N:1) Document owned by one org
- `users` as uploader (N:1) Document uploaded by one user
- `products` (N:0..1) Document may be linked to product
- `deals` (N:0..1) Document may be linked to deal

**Business Rules:**
- File size max 50MB
- Virus scan required before processing
- AI extraction runs automatically on supported types
- Expiry alerts sent 30, 15, 7, 1 days before expiration
- Verified documents cannot be modified (immutable)

---

### 3.13 inspections
**Purpose:** Quality assurance evidence collection and verification

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | UUID | 1 | Primary key |
| deal_id | UUID | 0..1 | Related deal |
| product_id | UUID | 0..1 | Inspected product |
| inspector_org_id | UUID | 0..1 | Inspecting entity |
| inspection_type | inspection_type | 1 | Checkpoint type |
| result | inspection_result | 1 | Outcome |
| quality_grade | VARCHAR(50) | 0..1 | Assigned grade |
| buyer_accepted | BOOLEAN | 0..1 | Buyer approval |

**Relationships:**
- `deals` (N:0..1) Inspection may be for one deal
- `products` (N:0..1) Inspection may be for one product
- `organizations` as inspected (N:1) One organization inspected
- `organizations` as inspector (N:0..1) One inspector may perform

**Business Rules:**
- Failed inspections trigger dispute workflow
- Buyer must accept or reject within 48 hours of report
- Photos required for pre-shipment inspections
- Inspector must be verified service provider

---

### 3.14 audit_logs
**Purpose:** Immutable record of all significant platform actions

| Attribute | Type | Cardinality | Description |
|---|---|---|---|
| id | BIGSERIAL | 1 | Primary key |
| actor_user_id | UUID | 0..1 | Performing user |
| actor_org_id | UUID | 0..1 | Performing organization |
| action | audit_action | 1 | Action type |
| entity_type | VARCHAR(50) | 1 | Target entity type |
| entity_id | UUID | 1 | Target entity ID |
| previous_state | JSONB | 0..1 | Before state |
| new_state | JSONB | 0..1 | After state |
| created_at | TIMESTAMPTZ | 1 | Timestamp |

**Business Rules:**
- Append-only, never updated or deleted
- Partitioned monthly for query performance
- Retained for 7 years minimum
- Accessible to platform admins and affected organization admins
- PII redacted in non-admin views

---

## 4. Cardinality Reference Matrix

| Entity | users | organizations | products | rfqs | deals | messages | documents |
|---|---|---|---|---|---|---|---|
| **users** | - | N:M (via members) | - | - | - | 1:N (sender) | 1:N (uploader) |
| **organizations** | N:M (via members) | - | 1:N | 1:N (buyer) | 1:N (both sides) | 1:N (sender) | 1:N |
| **products** | - | N:1 | - | - | N:0..1 (via quotes) | - | N:M |
| **rfqs** | - | N:1 (buyer) | - | - | 1:0..1 | 1:N | - |
| **deals** | - | N:1 (both sides) | N:1 (via quotes) | N:0..1 | - | 1:N | N:M |
| **messages** | N:1 (sender) | N:1 (sender org) | - | N:0..1 | N:0..1 | - | N:0..1 |
| **documents** | N:1 (uploader) | N:1 | N:M | - | N:M | N:0..1 | - |

## 5. Data Flow Patterns

### Write Path (Command)
```
Client → API Gateway → Auth Check → Business Logic → Database Write
                                    ↓
                              Event Bus (Kafka)
                                    ↓
                         Audit Log + Search Index + Notification
```

### Read Path (Query)
```
Client → API Gateway → Cache Check (Redis)
                           ↓ Hit
                      Return cached
                           ↓ Miss
                      Database Query → Cache Write → Return
```

### Search Path
```
Client → API Gateway → Elasticsearch Query → Facet Aggregation → Return
                              ↓
                        Background sync from PostgreSQL (CDC)
```

---

*AATOS Entity Relationship Model v1.0 | For Engineering & Data Teams*
