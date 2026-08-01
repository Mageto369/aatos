# AATOS — System Architecture

## 1. Executive Summary

AATOS is a **Trade Operating System**, not a marketplace. It is the digital infrastructure layer that connects verified African agricultural supply with global demand, coordinates compliance, inspection, documentation, payments, logistics, financing, and dispute resolution through one canonical identity system and one immutable transaction record.

This document defines the enterprise-grade architecture for the platform. It supports:
- **Millions of users** (farmers, cooperatives, exporters, importers, service providers)
- **Thousands of enterprises** (distributors, manufacturers, retailers, governments)
- **Hundreds of commodity categories** with category-specific attributes
- **100+ origin and destination countries**
- **Billions of records** across products, transactions, documents, and audit trails

## 2. Architectural Principles

| Principle | Decision |
|---|---|
| **Modular Monolith → Microservices** | Start with modular monolith. Decompose only when bounded contexts have independent scaling/team needs |
| **Domain-Driven Design** | Ubiquitous language, bounded contexts, aggregates, domain events |
| **Event-Driven Architecture** | Domain events for cross-context communication, decoupling write and read models where beneficial |
| **CQRS for Transaction & Analytics** | Command side for trade operations; query side for dashboards, search, analytics |
| **One Canonical Identity** | Single organization/user model across all roles (supplier, buyer, service provider, platform admin) |
| **Immutable Audit Trail** | Every verification, payment, inspection, document review, dispute event is append-only |
| **Compliance as Data** | Rules are configurable data, not hard-coded logic. Versioned, source-linked, review-dated |
| **Licensed Partner Integration** | Payments, escrow, identity, finance, insurance via regulated partner APIs — never build what requires a license |
| **Cloud-Native, Containerized** | Kubernetes, horizontal pod autoscaling, multi-region deployment |
| **Zero Trust** | Every request authenticated, every action authorized, every resource scoped |

## 3. Bounded Contexts (Phase 1-5)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AATOS PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Identity & Access          │  Product Catalog        │  Compliance     │
│  - Organizations            │  - Commodity Taxonomy   │  - Rule Engine  │
│  - Users                    │  - Listings             │  - Checklists   │
│  - Verification             │  - Inventory            │  - Documents    │
│  - Roles & Permissions      │  - Media & Documents    │  - Alerts       │
├─────────────────────────────────────────────────────────────────────────┤
│  Trade Operations           │  Financial Services     │  Logistics      │
│  - RFQ & Matching           │  - Escrow               │  - Freight      │
│  - Messaging                │  - Payments             │  - Tracking     │
│  - Quotations               │  - Trade Finance        │  - Customs      │
│  - Contracts                │  - Insurance            │  - Warehousing  │
│  - Orders (Deal Room)       │  - FX                   │  - Delivery     │
├─────────────────────────────────────────────────────────────────────────┤
│  Quality Assurance          │  Intelligence           │  Platform Ops   │
│  - Inspection               │  - Pricing              │  - Admin        │
│  - Laboratory               │  - Demand Forecasting   │  - Disputes     │
│  - Certification            │  - Market Reports       │  - Audit Logs   │
│  - Traceability             │  - APIs                 │  - Notifications│
├─────────────────────────────────────────────────────────────────────────┤
│  Cross-Cutting: Search, AI/ML, Notification, Analytics, API Gateway       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4. High-Level Component Diagram

```
                    ┌─────────────────┐
                    │   Client Apps   │
                    │ Web │ Mobile │  │
                    └────────┬────────┘
                             │ HTTPS/TLS 1.3
                    ┌────────▼────────┐
                    │   CDN / WAF     │
                    │  CloudFront/CF  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    │  Kong/AWS API   │
                    │  Rate Limiting  │
                    │  Authz Check    │
                    └────────┬────────┘
                             │ gRPC / REST
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  GraphQL       │  │  REST API       │  │  WebSocket      │
│  Gateway       │  │  Controllers    │  │  Gateway        │
│  (Read Model)  │  │  (Write Model)  │  │  (Real-time)    │
└───────┬────────┘  └────────┬────────┘  └────────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Application    │
                    │  Services       │
                    │  (Modular       │
                    │   Monolith)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  PostgreSQL    │  │  Redis          │  │  Elasticsearch  │
│  (Primary DB)  │  │  (Cache/Sessions│  │  (Search/Index) │
│  Multi-region  │  │  Pub/Sub)       │  │                 │
└────────────────┘  └────────────────┘  └─────────────────┘
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  S3 / GCS      │  │  Kafka /        │  │  TimescaleDB    │
│  (Documents)   │  │  RabbitMQ       │  │  (Time Series)  │
│  (Media)       │  │  (Events)       │  │  (Metrics)      │
└────────────────┘  └────────────────┘  └─────────────────┘
```

## 5. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Language** | TypeScript (Node.js) / Go | TypeScript for rapid iteration, Go for performance-critical paths |
| **Framework** | NestJS (modular, DDD-friendly) | Enterprise-grade, decorators, DI, built-in Swagger |
| **Database** | PostgreSQL 16 | ACID compliance, JSONB for flexible schemas, partitioning, row-level security |
| **Cache** | Redis Cluster | Sessions, rate limiting, query cache, pub/sub |
| **Search** | Elasticsearch 8 | Full-text search, faceted filtering, geo-search, aggregations |
| **Message Queue** | Apache Kafka | Event sourcing, stream processing, replay capability |
| **Object Storage** | AWS S3 (with CloudFront) | Document vault, media, backups |
| **Container Orchestration** | Kubernetes (EKS/GKE) | Auto-scaling, self-healing, multi-region |
| **Observability** | Datadog / Grafana + Prometheus | Metrics, traces, logs, alerts |
| **AI/ML** | Python microservices (FastAPI) | Document processing, NLP, fraud detection, pricing models |
| **Payments** | Stripe Connect / dLocal / Flutterwave | Licensed partners, local payment methods |
| **Identity Verification** | Onfido / Smile Identity / SumSub | KYC, document verification, biometric checks |

## 6. Data Flow: A Complete Trade Journey

```
1. Supplier Registration & Verification
   → Organization created → Users invited → Documents uploaded
   → Verification workflow triggered → AI document extraction
   → Manual review (if needed) → Verified badge assigned
   → Audit trail written → Search index updated

2. Product Listing
   → Category selected → Template loaded → Attributes filled
   → Media uploaded → Compliance eligibility checked
   → Listing published → Search index updated → Buyer alerts sent

3. Buyer RFQ
   → Buyer creates structured RFQ → Compliance requirements generated
   → Matching engine runs → Qualified suppliers notified
   → Suppliers review → Quotations created

4. Negotiation & Contract
   → Messaging between parties → Terms structured → Contract generated
   → E-signature → Deal Room created → Milestones defined

5. Inspection & Payment
   → Inspection booked → Inspector assigned → Evidence collected
   → Inspection report → Payment milestone released (escrow)

6. Shipment & Delivery
   → Freight booked → Tracking active → Customs coordinated
   → Delivery confirmed → Final payment released

7. Reputation & Analytics
   → Performance scores updated → Reviews collected
   → Market intelligence feeds updated → Repeat trade recommended
```

## 7. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Zero Trust Security Model                                   │
├─────────────────────────────────────────────────────────────┤
│  Perimeter: WAF + DDoS Protection + Bot Detection            │
│  Authentication: OAuth 2.0 + OIDC + MFA (TOTP/WebAuthn)      │
│  Authorization: RBAC + ABAC + Resource-level permissions     │
│  Data: AES-256 encryption at rest, TLS 1.3 in transit        │
│  Secrets: HashiCorp Vault / AWS Secrets Manager              │
│  Audit: Immutable append-only logs (separate DB + S3)        │
│  Compliance: GDPR, SOC 2 Type II, ISO 27001 roadmap          │
└─────────────────────────────────────────────────────────────┘
```

## 8. Scalability Strategy

| Dimension | Strategy |
|---|---|
| **Read scaling** | Read replicas, Redis caching, Elasticsearch, CQRS read model |
| **Write scaling** | Partitioning by tenant (organization_id) or corridor (origin-destination) |
| **Document storage** | S3 with CloudFront, pre-signed URLs, virus scanning on upload |
| **Search** | Elasticsearch with index sharding, incremental sync from PostgreSQL |
| **Events** | Kafka partitions by entity type, consumer groups for parallel processing |
| **Geographic** | Multi-region deployment (Africa hub + EU + US), data residency compliance |

## 9. Compliance Architecture

The Compliance Engine is the strategic moat. It must:
- Store rules as versioned, source-linked, review-dated data
- Generate checklists dynamically based on origin, destination, product, buyer type, shipment method
- Track every rule change with audit trail
- Allow AI-assisted review but never AI-invented regulations
- Integrate with official sources (government APIs, WTO, trade agreement databases)

## 10. Implementation Phases

| Phase | Timeline | Focus | Architecture Decision |
|---|---|---|---|
| **1** | Months 1-6 | Verified Marketplace | Modular monolith, single DB, single region |
| **2** | Months 7-12 | Compliance & Transactions | Introduce event bus, compliance rule engine |
| **3** | Months 13-18 | Payments & Logistics | Partner integrations, deal room, escrow |
| **4** | Months 19-24 | Finance & Intelligence | Separate analytics DB, ML pipelines |
| **5** | Months 25-36 | Global Scale | Microservice extraction, multi-region, government APIs |

---
*AATOS Architecture v1.0 | Confidential | For Internal Product & Engineering Discussion*
