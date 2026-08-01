# AATOS — Sequence Diagrams

## 1. Executive Summary

These sequence diagrams define the critical trade workflows in the AATOS platform. Each diagram represents a complete business process from initiation to completion, showing interactions between users, the platform, external services, and partner systems.

## 2. Supplier Onboarding & Verification

```mermaid
sequenceDiagram
    actor Supplier as Supplier User
    participant Web as Web App
    participant API as API Gateway
    participant Auth as Auth Service
    participant Org as Organization Service
    participant Doc as Document Service
    participant AI as AI Service
    participant Review as Verification Review Queue
    participant Notify as Notification Service
    participant S3 as Document Storage

    Supplier->>Web: Register account (email/password)
    Web->>API: POST /auth/register
    API->>Auth: Create user
    Auth-->>API: User created (usr_xxx)
    API-->>Web: Registration successful
    
    Supplier->>Web: Verify email (click link)
    Web->>API: GET /auth/verify?token=xxx
    Auth-->>Web: Email verified
    
    Supplier->>Web: Create organization profile
    Web->>API: POST /organizations
    API->>Org: Create org (draft status)
    Org-->>API: org_xxx created
    API-->>Web: Organization created
    
    Supplier->>Web: Upload documents (business reg, licenses)
    Web->>API: POST /documents (multipart)
    API->>S3: Store file
    API->>Doc: Create document record (processing)
    Doc-->>API: doc_xxx created
    API-->>Web: 202 Accepted (processing)
    
    par AI Document Processing
        Doc->>AI: Extract document fields
        AI->>AI: OCR + Classification + Field extraction
        AI-->>Doc: Extracted data + confidence
        Doc->>Doc: Update document (extracted_data)
    and Virus Scan
        Doc->>S3: Trigger virus scan
        S3-->>Doc: Clean
    end
    
    Doc->>Doc: Update status to "pending_review"
    Doc->>Review: Add to verification queue
    Review->>Notify: Notify compliance team
    
    actor Reviewer as Compliance Reviewer
    Reviewer->>Web: Review document in queue
    Web->>API: GET /documents/{id}
    API-->>Web: Document with AI extraction
    
    Reviewer->>Web: Approve document
    Web->>API: PATCH /documents/{id} {status: "verified"}
    API->>Doc: Update status
    Doc->>Org: Update verification progress
    
    alt All documents verified
        Org->>Org: Update org status to "verified"
        Org->>Org: Calculate trust_score
        Org->>Notify: Notify supplier of full verification
    end
    
    Notify-->>Supplier: Email + In-app: "Document verified"
    Notify-->>Supplier: Email: "Organization fully verified!"
```

## 3. Buyer Publishes RFQ & Supplier Matching

```mermaid
sequenceDiagram
    actor Buyer as Buyer User
    participant Web as Web App
    participant API as API Gateway
    participant RFQ as RFQ Service
    participant Match as Matching Engine
    participant Product as Product Service
    participant Compliance as Compliance Engine
    participant Notify as Notification Service
    participant Search as Elasticsearch
    actor Supplier as Matched Suppliers

    Buyer->>Web: Create RFQ
    Web->>Web: Multi-step form (Product → Quantity → Terms → Review)
    Buyer->>Web: Submit RFQ
    Web->>API: POST /rfqs
    API->>RFQ: Create RFQ (status: draft)
    
    alt Buyer publishes RFQ
        Buyer->>Web: Publish RFQ
        Web->>API: PATCH /rfqs/{id} {status: "published"}
        API->>RFQ: Update status to published
        RFQ->>RFQ: Set published_at
        
        par Compliance Check
            RFQ->>Compliance: Generate checklist (origin→destination)
            Compliance->>Compliance: Query rules database
            Compliance-->>RFQ: Checklist with requirements
        and Supplier Matching
            RFQ->>Match: Trigger matching engine
            Match->>Search: Query products by category, country, capacity
            Search-->>Match: Candidate suppliers
            Match->>Product: Filter by capacity, availability, compliance
            Match->>Match: Score by trust, price, history, geography
            Match-->>RFQ: Ranked supplier list
        end
        
        RFQ->>Notify: Notify matched suppliers (top 20)
        
        loop For each matched supplier
            Notify->>Supplier: Push + Email: "New RFQ matching your products"
        end
        
        RFQ-->>Web: RFQ published, 23 suppliers matched
        Web-->>Buyer: "RFQ published! 23 suppliers notified."
    end
    
    Supplier->>Web: View RFQ
    Web->>API: GET /rfqs/{id}
    API-->>Web: RFQ details
    
    Supplier->>Web: Review RFQ & prepare quote
    Supplier->>Web: Submit quotation
    Web->>API: POST /rfqs/{id}/quotes
    API->>RFQ: Create quotation
    RFQ->>Notify: Notify buyer of new quote
    Notify-->>Buyer: "New quote received from Nairobi Coffee Exporters"
    
    RFQ-->>Web: Quote submitted
    Web-->>Supplier: "Quote sent successfully"
```

## 4. Deal Creation & Contract Signing

```mermaid
sequenceDiagram
    actor Buyer as Buyer User
    actor Supplier as Supplier User
    participant Web as Web App
    participant API as API Gateway
    participant Deal as Deal Service
    participant Contract as Contract Service
    participant Milestone as Milestone Service
    participant Compliance as Compliance Engine
    participant Payment as Payment Service
    participant Escrow as Escrow Partner
    participant Notify as Notification Service
    participant Audit as Audit Log Service

    Buyer->>Web: Review quotes & select winner
    Buyer->>Web: Award deal to supplier
    Web->>API: POST /deals
    API->>Deal: Create deal (status: negotiating)
    Deal->>Milestone: Create milestone pipeline
    Milestone-->>Deal: 6 milestones created
    Deal->>Compliance: Generate deal compliance checklist
    Compliance-->>Deal: Checklist attached
    Deal-->>API: Deal created (deal_xxx)
    API-->>Web: Deal room ready
    
    Web-->>Buyer: "Deal room created. Awaiting contract."
    
    par Contract Drafting
        Buyer->>Web: Review contract terms
        Web->>API: GET /deals/{id}/contract-template
        API->>Contract: Generate from template + deal terms
        Contract-->>API: Contract draft
        API-->>Web: Contract preview
        
        Buyer->>Web: Accept & sign contract
        Web->>API: POST /deals/{id}/sign
        API->>Contract: Record e-signature
        Contract->>Audit: Log signature event
    and Supplier Notification
        Deal->>Notify: Notify supplier of deal award
        Notify-->>Supplier: Email + Push: "You've been awarded a deal!"
    end
    
    Supplier->>Web: Review & sign contract
    Web->>API: POST /deals/{id}/sign
    API->>Contract: Record e-signature
    Contract->>Deal: Update status: contract_signed
    Deal->>Milestone: Activate first milestone (contract_signing → completed)
    Milestone->>Milestone: Activate next: advance_payment
    
    Deal->>Audit: Log deal status change
    Deal->>Notify: Notify both parties
    Notify-->>Buyer: "Contract signed by both parties"
    Notify-->>Supplier: "Contract signed. Advance payment due."
    
    Deal-->>API: Updated deal
    API-->>Web: Contract fully executed
    Web-->>Buyer: "Contract signed! Proceed to payment."
    Web-->>Supplier: "Contract signed! Awaiting advance payment."
```

## 5. Payment via Escrow

```mermaid
sequenceDiagram
    actor Buyer as Buyer User
    actor Supplier as Supplier User
    participant Web as Web App
    participant API as API Gateway
    participant Payment as Payment Service
    participant Escrow as Escrow Partner API
    participant Deal as Deal Service
    participant Milestone as Milestone Service
    participant Notify as Notification Service
    participant Audit as Audit Log Service

    Note over Buyer,Supplier: Milestone: Advance Payment (30% = $153,000)
    
    Buyer->>Web: Initiate advance payment
    Web->>API: POST /payments
    API->>Payment: Create payment record (pending)
    Payment->>Escrow: Create escrow hold
    Escrow-->>Payment: Escrow reference: esc_xxx
    Payment->>Deal: Link payment to deal
    
    Buyer->>Web: Complete payment (bank transfer / card)
    Web->>API: PATCH /payments/{id} {status: "held"}
    API->>Payment: Update status
    Payment->>Escrow: Confirm funds received
    Escrow-->>Payment: Funds held in escrow
    
    Payment->>Milestone: Mark advance_payment completed
    Milestone->>Milestone: Activate next: inspection_completion
    
    Payment->>Audit: Log payment event
    Payment->>Notify: Notify supplier
    Notify-->>Supplier: "Advance payment of $153,000 received in escrow"
    
    Payment-->>API: Payment held
    API-->>Web: Payment confirmed
    Web-->>Buyer: "$153,000 held in escrow. Supplier notified."
    
    Note over Buyer,Supplier: Milestone: Main Payment (70% = $357,000)
    
    Supplier->>Web: Request main payment release
    Web->>API: POST /payments/{id}/request-release
    API->>Payment: Initiate release request
    
    alt Inspection passed, documents verified
        Payment->>Escrow: Release funds to supplier
        Escrow-->>Payment: Funds released
        Payment->>Payment: Update status: released
        Payment->>Milestone: Mark main_payment completed
        Milestone->>Milestone: Activate next: delivery_confirmation
        
        Payment->>Audit: Log release event
        Payment->>Notify: Notify both parties
        Notify-->>Supplier: "$357,000 released to your account"
        Notify-->>Buyer: "Payment released to supplier"
    else Inspection failed
        Payment->>Escrow: Hold funds, initiate dispute
        Escrow-->>Payment: Funds frozen
        Payment->>Deal: Update status: disputed
        Payment->>Notify: Notify both parties
        Notify-->>Buyer: "Inspection failed. Payment held. Dispute process started."
        Notify-->>Supplier: "Inspection failed. Please review corrective actions."
    end
```

## 6. Inspection Workflow

```mermaid
sequenceDiagram
    actor Buyer as Buyer User
    actor Supplier as Supplier User
    actor Inspector as Inspector (Service Provider)
    participant Web as Web App
    participant API as API Gateway
    participant Inspection as Inspection Service
    participant ServiceDir as Service Provider Directory
    participant Deal as Deal Service
    participant Milestone as Milestone Service
    participant Doc as Document Service
    participant AI as AI Analysis Service
    participant Notify as Notification Service

    Note over Buyer,Inspector: Milestone: Inspection Completion
    
    Supplier->>Web: Book pre-shipment inspection
    Web->>API: POST /inspections/book
    API->>ServiceDir: Find available inspectors (Kenya, coffee)
    ServiceDir-->>API: 3 available inspectors
    API-->>Web: Inspector list with pricing
    
    Supplier->>Web: Select inspector & schedule
    Web->>API: PATCH /inspections/{id} {inspector, date}
    API->>Inspection: Assign inspector
    Inspection->>Notify: Notify inspector
    Notify-->>Inspector: "New inspection booking: Nairobi Coffee Exporters"
    
    Inspector->>Web: Confirm booking
    Web->>API: PATCH /inspections/{id}/confirm
    API->>Inspection: Update status: confirmed
    Inspection->>Milestone: Update milestone status: in_progress
    Inspection->>Notify: Notify both parties
    Notify-->>Supplier: "Inspection confirmed for Sep 20"
    Notify-->>Buyer: "Pre-shipment inspection scheduled"
    
    Note over Inspector: Inspection Day
    
    Inspector->>Web: Conduct inspection (mobile app)
    Web->>API: PATCH /inspections/{id}
    API->>Inspection: Update findings
    
    Inspector->>Web: Upload photos/videos
    Web->>API: POST /documents (inspection evidence)
    API->>Doc: Store inspection documents
    
    Inspector->>Web: Submit inspection report
    Web->>API: PATCH /inspections/{id} {result: "pass"}
    API->>Inspection: Update result
    Inspection->>AI: Analyze photos for quality verification
    AI-->>Inspection: Quality metrics (confidence: 0.92)
    
    Inspection->>Doc: Link report document
    Inspection->>Milestone: Mark inspection completed
    Milestone->>Milestone: Activate next: shipment_booking
    
    Inspection->>Notify: Notify both parties
    Notify-->>Buyer: "Inspection PASSED. View report."
    Notify-->>Supplier: "Inspection passed. Proceed to shipment."
    
    Buyer->>Web: Review inspection report
    Web->>API: GET /inspections/{id}
    API-->>Web: Full inspection report with photos
    
    Buyer->>Web: Accept inspection results
    Web->>API: PATCH /inspections/{id}/accept
    API->>Inspection: Record buyer acceptance
    Inspection->>Deal: Update inspection_status
    Inspection->>Milestone: Confirm milestone complete
    
    Inspection-->>API: Updated
    API-->>Web: Inspection accepted
    Web-->>Buyer: "Inspection accepted. Payment release triggered."
```

## 7. Real-time Messaging in Deal Room

```mermaid
sequenceDiagram
    actor Buyer as Buyer User
    actor Supplier as Supplier User
    participant WebB as Buyer Web App
    participant WebS as Supplier Web App
    participant WS as WebSocket Gateway
    participant API as API Gateway
    participant Msg as Message Service
    participant Translate as Translation Service
    participant Notify as Notification Service

    Note over Buyer,Supplier: Both connected to deal:deal_xxx channel
    
    Buyer->>WebB: Type message + attach file
    Buyer->>WebB: Send
    WebB->>API: POST /messages
    API->>Msg: Create message
    
    par Translation
        Msg->>Translate: Detect language & translate
        Translate-->>Msg: Translations: {sw: "...", fr: "..."}
    end
    
    Msg->>WS: Broadcast to deal:deal_xxx channel
    WS->>WebB: Echo message (with read receipt)
    WS->>WebS: Push new message
    
    Supplier->>WebS: Message received (notification sound)
    Supplier->>WebS: Read message
    WebS->>WS: Send read receipt
    WS->>WebB: Update read status
    
    Msg->>Notify: Create in-app notification (for offline users)
    
    alt File attachment
        Buyer->>WebB: Attach document
        WebB->>API: POST /documents (multipart)
        API->>Msg: Link document to message
        Msg->>WS: Broadcast message with file
        WS->>WebS: Message with downloadable file
    end
    
    alt Supplier replies
        Supplier->>WebS: Type response
        WebS->>API: POST /messages
        API->>Msg: Create message
        Msg->>Translate: Translate if needed
        Msg->>WS: Broadcast
        WS->>WebB: New message from supplier
        WebB->>WebB: Show notification + update thread
    end
```

## 8. Compliance Rule Update & Propagation

```mermaid
sequenceDiagram
    actor Admin as Compliance Admin
    participant Web as Admin Dashboard
    participant API as API Gateway
    participant Compliance as Compliance Engine
    participant RulesDB as Compliance Rules DB
    participant Cache as Redis Cache
    participant Search as Elasticsearch
    participant Notify as Notification Service
    actor AffectedOrgs as Affected Organizations

    Admin->>Web: Review compliance rule update
    Admin->>Web: Update rule (Kenya→EU coffee phytosanitary requirement)
    Web->>API: PUT /compliance/rules/{id}
    API->>Compliance: Update rule
    Compliance->>RulesDB: Store updated rule (new version)
    RulesDB-->>Compliance: Rule updated
    
    Compliance->>Cache: Invalidate cached checklists for KE→EU corridor
    Compliance->>Search: Reindex affected products
    
    Compliance->>Compliance: Identify affected organizations
    Compliance->>Notify: Alert affected orgs
    
    loop For each affected org
        Notify->>AffectedOrgs: Email + In-app: "Compliance requirement updated"
    end
    
    Compliance-->>API: Rule updated, 47 orgs affected
    API-->>Web: Update confirmed
    Web-->>Admin: "Rule updated. 47 organizations notified."
    
    AffectedOrgs->>Web: View updated compliance checklist
    Web->>API: GET /compliance/check
    API->>Compliance: Generate fresh checklist
    Compliance->>RulesDB: Query latest rules (bypass cache)
    RulesDB-->>Compliance: Updated rules
    Compliance-->>API: Updated checklist with new requirement
    API-->>Web: Fresh compliance data
    Web-->>AffectedOrgs: "Updated requirements shown"
```

## 9. Dispute Resolution Workflow

```mermaid
sequenceDiagram
    actor Buyer as Buyer User
    actor Supplier as Supplier User
    actor Mediator as Platform Mediator
    participant Web as Web App
    participant API as API Gateway
    participant Deal as Deal Service
    participant Dispute as Dispute Service
    participant Escrow as Escrow Partner
    participant Doc as Document Service
    participant Audit as Audit Log Service
    participant Notify as Notification Service

    Buyer->>Web: Report issue (quality mismatch)
    Web->>API: POST /disputes
    API->>Dispute: Create dispute
    Dispute->>Deal: Update status: disputed
    Dispute->>Escrow: Freeze funds
    
    Dispute->>Doc: Collect all deal documents, messages, inspection reports
    Doc-->>Dispute: Evidence package
    Dispute->>Audit: Log dispute creation
    
    Dispute->>Notify: Notify parties
    Notify-->>Supplier: "Dispute raised. Funds frozen. Respond required."
    Notify-->>Buyer: "Dispute filed. Awaiting supplier response."
    
    Supplier->>Web: Respond to dispute with evidence
    Web->>API: PATCH /disputes/{id}/respond
    API->>Dispute: Add supplier response
    Dispute->>Doc: Attach supplier evidence
    
    alt Direct Resolution
        Buyer->>Web: Review response
        Buyer->>Web: Accept resolution (partial refund)
        Web->>API: POST /disputes/{id}/resolve
        API->>Dispute: Resolve dispute
        Dispute->>Escrow: Release agreed funds
        Dispute->>Deal: Update status: resolved
        Dispute->>Audit: Log resolution
        Dispute->>Notify: Notify parties
        Notify-->>Buyer: "Dispute resolved. Refund processed."
        Notify-->>Supplier: "Dispute resolved. Remaining funds released."
    else Mediation Required
        Dispute->>Notify: Escalate to mediator
        Notify-->>Mediator: "Dispute requires mediation"
        
        Mediator->>Web: Review evidence package
        Web->>API: GET /disputes/{id}/evidence
        API-->>Web: Complete evidence timeline
        
        Mediator->>Web: Schedule call / request more evidence
        Mediator->>Web: Issue ruling
        Web->>API: POST /disputes/{id}/mediate
        API->>Dispute: Record mediation outcome
        Dispute->>Escrow: Execute ruling (refund / release / split)
        Dispute->>Deal: Update status: resolved
        Dispute->>Audit: Log mediation outcome
        Dispute->>Notify: Notify parties
        Notify-->>Buyer: "Mediation complete. Ruling: [outcome]"
        Notify-->>Supplier: "Mediation complete. Ruling: [outcome]"
    end
```

## 10. AI Document Processing Pipeline

```mermaid
sequenceDiagram
    actor User as User
    participant Web as Web App
    participant API as API Gateway
    participant Upload as Upload Service
    participant S3 as Object Storage
    participant Queue as Message Queue (Kafka)
    participant Virus as Virus Scanner
    participant AI as AI Microservice (Python/FastAPI)
    participant OCR as OCR Engine (Tesseract/AWS Textract)
    participant NLP as NLP Model (spaCy/transformers)
    participant DocDB as Document DB
    participant Notify as Notification Service

    User->>Web: Upload document (PDF/PNG/JPG)
    Web->>API: POST /documents (multipart)
    API->>Upload: Receive file
    Upload->>S3: Store raw file
    Upload->>DocDB: Create record (status: processing)
    Upload->>Queue: Publish event: document.uploaded
    
    par Virus Scan
        Queue->>Virus: Consume event
        Virus->>S3: Download & scan
        alt Clean
            Virus->>Queue: Publish: document.clean
        else Infected
            Virus->>DocDB: Update status: rejected (virus)
            Virus->>Queue: Publish: document.rejected
            Virus->>Notify: Alert user
        end
    end
    
    Queue->>AI: Consume: document.clean
    
    par Document Analysis
        AI->>OCR: Extract text from image/PDF
        OCR-->>AI: Raw text content
        
        AI->>NLP: Classify document type
        NLP-->>AI: Type: export_license (confidence: 0.96)
        
        AI->>NLP: Extract structured fields
        NLP-->>AI: Fields: {license_number, valid_from, valid_until, issuing_authority}
        
        AI->>NLP: Detect anomalies / forgeries
        NLP-->>AI: Anomaly score: 0.05 (low risk)
    end
    
    AI->>DocDB: Update with extracted data
    AI->>Queue: Publish: document.processed
    
    Queue->>Notify: Notify user
    Notify-->>User: "Document processed. 6 fields extracted."
    
    User->>Web: View processed document
    Web->>API: GET /documents/{id}
    API->>DocDB: Fetch document
    DocDB-->>API: Document with extracted data
    API-->>Web: Document details
    Web-->>User: Document card with AI extraction results
```

---

*AATOS Sequence Diagrams v1.0 | For Engineering & Product Teams*
