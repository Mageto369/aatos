# AATOS — African Agricultural Trade Operating System

## Technical Blueprint

This repository contains the enterprise-grade technical foundation for AATOS — the operating system for global agricultural trade between Africa and the world.

---

## 📁 Repository Structure

```
aatos/
├── docs/
│   ├── ARCHITECTURE.md          # System architecture, principles, component diagrams
│   ├── DATA_MODEL.md            # Entity definitions, relationships, cardinality matrix
│   └── SECURITY.md              # Security model, threat assessment, controls (TODO)
│
├── schema/
│   └── 01_core_schema.sql       # PostgreSQL 16 database schema
│                                  # - All tables, enums, indexes, constraints
│                                  # - Full-text search vectors
│                                  # - Partitioned tables (messages, audit_logs)
│                                  # - RLS policies
│                                  # - Views and functions
│
├── api/
│   └── API_SPECIFICATION.md     # REST API specification
│                                  # - Authentication & Identity
│                                  # - Organizations, Documents, Products
│                                  # - RFQs, Quotations, Deals, Messages
│                                  # - Compliance, WebSocket events
│                                  # - Error formats, rate limits, versioning
│
├── frontend/
│   └── FRONTEND_ARCHITECTURE.md # React application architecture
│                                  # - Component hierarchy and screen designs
│                                  # - Design system (colors, typography, tokens)
│                                  # - State management (Zustand + React Query)
│                                  # - File structure and performance strategy
│
└── diagrams/
    └── SEQUENCE_DIAGRAMS.md     # 10 critical business process flows
                                   # - Supplier onboarding & verification
                                   # - RFQ creation & supplier matching
                                   # - Deal creation & contract signing
                                   # - Escrow payments
                                   # - Inspection workflow
                                   # - Real-time messaging
                                   # - Compliance rule updates
                                   # - Dispute resolution
                                   # - AI document processing
```

---

## 🏗️ What's Been Built

### 1. System Architecture
- **Bounded contexts** for 17 platform layers
- **Technology stack** selection with justifications
- **Scalability strategy** for reads, writes, search, events, geographic expansion
- **Security architecture** with Zero Trust model
- **5-phase implementation roadmap** (36 months)

### 2. Database Schema (PostgreSQL)
- **22 tables** covering identity, products, trade operations, compliance, audit
- **16 custom ENUM types** for type safety
- **60+ indexes** for query performance (B-tree, GIN, GiST)
- **Partitioned tables** for messages and audit logs (monthly partitions)
- **Row-level security** policies for multi-tenant isolation
- **Full-text search** with weighted vectors and triggers
- **Soft deletes** on all business entities
- **Immutable audit log** with append-only design
- **Views** for supplier performance and active deals dashboards

### 3. API Specification
- **14 endpoint groups** with 40+ operations
- **OAuth 2.0 + OIDC** authentication
- **RBAC + ABAC** authorization
- **RFC 7807** Problem Details error format
- **Cursor-based pagination** for high-volume endpoints
- **WebSocket events** for real-time deal rooms
- **Rate limiting** by tier (standard vs enterprise)
- **Idempotency keys** for safe retries

### 4. Frontend Architecture
- **React 19 + TypeScript + Tailwind CSS** stack
- **Feature-based module** structure
- **10 screen designs** with wireframe descriptions
- **Design system** with complete token definitions
- **Zustand + React Query** state architecture
- **Accessibility** (WCAG 2.1 AA) requirements
- **Mobile-first responsive** strategy
- **PWA** capabilities for offline document viewing

### 5. Sequence Diagrams
- **10 end-to-end workflows** from user action to system completion
- Covers: onboarding, RFQ, deal creation, payments, inspections, messaging, compliance, disputes, AI processing

---

## 📊 Key Metrics

| Metric | Value |
|---|---|
| Database Tables | 22 |
| Custom ENUMs | 16 |
| Database Indexes | 60+ |
| API Endpoints | 40+ |
| Frontend Screens Designed | 10 |
| Sequence Diagrams | 10 |
| Total Documentation | ~150,000 words |

---

## 🚀 Next Steps

To continue building AATOS, the following workstreams are ready to begin:

### Phase 1: Verified Marketplace (Months 1-6)
1. **Infrastructure Setup**
   - Provision Kubernetes cluster (EKS/GKE)
   - Set up PostgreSQL with read replicas
   - Configure Redis cluster, Elasticsearch, Kafka
   - Set up CI/CD pipelines

2. **Backend Development**
   - Implement NestJS modular monolith
   - Build Identity & Organization services
   - Implement Document Vault with S3 integration
   - Build Product Catalog with JSON Schema validation
   - Implement RFQ & Matching engine
   - Build Messaging service with WebSocket gateway

3. **Frontend Development**
   - Set up React + Vite project
   - Build design system components
   - Implement auth flows (login, register, MFA)
   - Build organization profile screens
   - Implement product create/edit flows
   - Build RFQ creation and discovery
   - Implement Deal Room MVP

4. **AI Integration**
   - Set up Python FastAPI microservice
   - Implement document OCR and classification
   - Build field extraction models
   - Implement fraud detection baseline

5. **Compliance Foundation**
   - Build rule engine data model
   - Seed initial rules for pilot corridors
   - Implement checklist generation
   - Build compliance dashboard

### Phase 2: Compliance & Transactions (Months 7-12)
- Contract templates and e-signature integration
- Milestone tracking and automation
- Inspection booking workflow
- Advanced compliance rule engine
- Transaction reporting and analytics

### Phase 3: Payments & Logistics (Months 13-18)
- Escrow partner integrations
- Payment milestone automation
- Freight booking and tracking
- Customs documentation workflow
- Insurance product integration

### Phase 4: Finance & Intelligence (Months 19-24)
- Trade finance partner integrations
- Advanced risk scoring models
- Pricing intelligence and market reports
- Enterprise procurement portals
- API product for third-party integrations

### Phase 5: Global Scale (Months 25-36)
- Microservice extraction from monolith
- Multi-region deployment
- Government API integrations
- Advanced AI/ML capabilities
- Data products and subscriptions

---

## 🛡️ Security Considerations

- All endpoints require authentication
- Row-level security enforces multi-tenant isolation
- Document uploads scanned for viruses
- Payments handled exclusively by licensed partners
- Audit logs are append-only and retained for 7 years
- PII encrypted at rest
- TLS 1.3 required for all communications
- SOC 2 Type II and ISO 27001 compliance roadmap defined

---

## 📞 Architecture Decisions

### Why Modular Monolith?
> Start with one deployable unit. Decompose into microservices only when bounded contexts need independent scaling or separate teams. This reduces operational complexity during MVP while preserving clean architecture boundaries.

### Why PostgreSQL?
> ACID compliance for financial transactions. JSONB for flexible category-specific attributes. Built-in full-text search. Row-level security. Excellent partitioning support. Proven at billion-record scale.

### Why Cursor-Based Pagination?
> Offset pagination becomes slow and inconsistent under high write volume. Cursor pagination (using indexed created_at + id) guarantees consistency and performance even with concurrent inserts.

### Why Compliance as Data?
> Hard-coded rules require code deployments for regulatory changes. Storing rules as versioned, source-linked data allows compliance team to update requirements without engineering involvement, while maintaining full audit trail.

---

*AATOS Technical Blueprint v1.0*
*Built for the most trusted system for completing agricultural trade between Africa and the world.*
