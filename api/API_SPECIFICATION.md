# AATOS — API Specification

## 1. Executive Summary

This document defines the REST API surface for the AATOS Trade Operating System. All APIs are versioned (`/v1/`), authenticated via OAuth 2.0 + OIDC, and return JSON. The API is designed for:
- Web and mobile clients
- Enterprise integrations (ERP, procurement systems)
- Partner service providers (labs, inspectors, freight forwarders)
- Government trade systems

## 2. API Standards

| Standard | Implementation |
|---|---|
| **Base URL** | `https://api.aatos.trade/v1` |
| **Authentication** | JWT Bearer tokens (RS256/HS256), issued via email/password login |
| **Authorization** | RBAC + ABAC via JWT scopes and resource-level permissions |
| **Content-Type** | `application/json` (default), `multipart/form-data` for uploads |
| **Pagination** | Cursor-based (`after`, `before`, `limit`) for high-volume; offset for small collections |
| **Filtering** | Query params: `?status=active&country=KE&category=coffee` |
| **Sorting** | `?sort=-created_at` (desc) or `?sort=trust_score` (asc) |
| **Rate Limiting** | 100 req/min for standard, 1000 req/min for enterprise |
| **Idempotency** | `Idempotency-Key` header for POST/PUT/PATCH |
| **Error Format** | RFC 7807 Problem Details (`application/problem+json`) |

## 3. Error Responses

### Standard Error Format
```json
{
  "type": "https://api.aatos.trade/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The request body contains invalid fields",
  "instance": "/v1/organizations",
  "request_id": "req_abc123xyz",
  "errors": [
    {
      "field": "email",
      "code": "invalid_format",
      "message": "Must be a valid email address"
    },
    {
      "field": "country_code",
      "code": "unsupported_country",
      "message": "Country 'XX' is not supported"
    }
  ]
}
```

### HTTP Status Codes
| Code | Meaning | When Used |
|---|---|---|
| 200 | OK | GET, PUT, PATCH successful |
| 201 | Created | POST successful |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Validation error, malformed JSON |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token, insufficient permissions |
| 404 | Not Found | Resource doesn't exist or not accessible |
| 409 | Conflict | Resource already exists, state conflict |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (retry with backoff) |

## 4. Authentication & Identity

AATOS currently implements JWT-based authentication with email/password login. OAuth 2.0 + OIDC are planned for future enterprise integrations but are not implemented in the current release.

### POST /auth/login
Authenticate with email and password to receive JWT access and refresh tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "refreshtoken_xxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "organizations": [
      {
        "id": "org_abc456",
        "name": "Nairobi Coffee Exporters Ltd",
        "type": "exporter",
        "role": "owner",
        "permissions": ["*"]
      }
    ]
  }
}
```

> **Note:** The `/auth/token` endpoint described in earlier versions (OAuth 2.0 Authorization Code flow) is not implemented. Use `/auth/login` instead.

### GET /auth/me
Get current user profile with active organization context.

**Response:**
```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "email_verified": true,
  "phone": "+254712345678",
  "phone_verified": true,
  "first_name": "Jane",
  "last_name": "Doe",
  "display_name": "Jane Doe",
  "avatar_url": "https://cdn.aatos.trade/avatars/usr_abc123.jpg",
  "status": "active",
  "mfa_enabled": true,
  "organizations": [
    {
      "id": "org_abc456",
      "name": "Nairobi Coffee Exporters Ltd",
      "type": "exporter",
      "role": "owner",
      "verification_level": "fully_verified",
      "permissions": ["*"]
    }
  ],
  "active_organization_id": "org_abc456",
  "created_at": "2026-01-15T10:30:00Z",
  "last_login_at": "2026-07-31T14:22:00Z"
}
```

### POST /auth/switch-organization
Switch active organization context.

**Request:**
```json
{
  "organization_id": "org_xyz789"
}
```

**Response:** New access token with updated scopes.

---

## 5. Organizations

### POST /organizations
Create a new organization (supplier, buyer, or service provider).

**Authentication:** Required (user must be authenticated)
**Authorization:** Any authenticated user
**Idempotency:** Required

**Request:**
```json
{
  "name": "Nairobi Coffee Exporters Ltd",
  "legal_name": "Nairobi Coffee Exporters Limited",
  "type": "exporter",
  "country_code": "KE",
  "region": "Nairobi",
  "city": "Nairobi",
  "address": "123 Mombasa Road, Industrial Area",
  "postal_code": "00100",
  "registration_number": "BRN-KE-2018-001234",
  "tax_id": "TIN-KE-987654321",
  "year_established": 2015,
  "employee_count": "11-50",
  "website": "https://nairobicoffee.co.ke",
  "description": "Premium Arabica coffee exporter specializing in AA and AB grades",
  "annual_capacity": 5000,
  "capacity_unit": "mt",
  "processing_capacity": true,
  "storage_capacity": true,
  "cold_chain": true,
  "bank_name": "KCB Bank Kenya",
  "timezone": "Africa/Nairobi",
  "locale": "en",
  "currency_preference": "USD"
}
```

**Validation Rules:**
- `name`: 2-200 chars, required
- `type`: must be valid org_type enum
- `country_code`: ISO 3166-1 alpha-2, required
- `registration_number`: unique per country_code
- `annual_capacity`: positive number if provided

**Response (201):**
```json
{
  "id": "org_abc456",
  "name": "Nairobi Coffee Exporters Ltd",
  "slug": "nairobi-coffee-exporters-ltd",
  "type": "exporter",
  "status": "draft",
  "verification_level": "none",
  "country_code": "KE",
  "city": "Nairobi",
  "profile_completeness": 45,
  "risk_score": 50,
  "trust_score": 0,
  "created_at": "2026-07-31T19:30:00Z",
  "updated_at": "2026-07-31T19:30:00Z"
}
```

**Error (409):**
```json
{
  "type": "https://api.aatos.trade/errors/organization-exists",
  "title": "Organization Already Exists",
  "status": 409,
  "detail": "An organization with this registration number already exists in Kenya",
  "errors": [
    {
      "field": "registration_number",
      "code": "duplicate",
      "message": "Registration number BRN-KE-2018-001234 is already registered"
    }
  ]
}
```

### GET /organizations/{id}
Get organization profile (public view shows limited fields; full view for members).

**Authentication:** Optional (public fields accessible without auth)
**Authorization:** Full data for members; limited data for public

**Response (Public):**
```json
{
  "id": "org_abc456",
  "name": "Nairobi Coffee Exporters Ltd",
  "slug": "nairobi-coffee-exporters-ltd",
  "type": "exporter",
  "status": "verified",
  "verification_level": "fully_verified",
  "country_code": "KE",
  "city": "Nairobi",
  "year_established": 2015,
  "employee_count": "11-50",
  "description": "Premium Arabica coffee exporter specializing in AA and AB grades",
  "annual_capacity": 5000,
  "capacity_unit": "mt",
  "processing_capacity": true,
  "storage_capacity": true,
  "cold_chain": true,
  "profile_completeness": 95,
  "trust_score": 87,
  "risk_score": 15,
  "verified_at": "2026-03-15T10:00:00Z",
  "product_count": 12,
  "completed_deals": 47,
  "average_rating": 4.7
}
```

### GET /organizations
Search and filter organizations.

**Query Parameters:**
- `type`: `exporter` (filter by org type)
- `country`: `KE,ET,NG` (comma-separated ISO codes)
- `verification_level`: `fully_verified`
- `category`: `coffee` (has products in this category)
- `trust_score_min`: `70`
- `risk_score_max`: `30`
- `q`: `nairobi coffee` (full-text search)
- `sort`: `-trust_score` (descending)
- `limit`: `20` (default 20, max 100)
- `after`: `cursor_xyz` (cursor for pagination)

**Response:**
```json
{
  "data": [
    {
      "id": "org_abc456",
      "name": "Nairobi Coffee Exporters Ltd",
      "type": "exporter",
      "country_code": "KE",
      "city": "Nairobi",
      "verification_level": "fully_verified",
      "trust_score": 87,
      "risk_score": 15,
      "product_count": 12,
      "annual_capacity": 5000
    }
  ],
  "pagination": {
    "limit": 20,
    "total": 142,
    "has_more": true,
    "next_cursor": "cursor_abc789",
    "previous_cursor": null
  }
}
```

### PATCH /organizations/{id}
Update organization profile.

**Authentication:** Required
**Authorization:** Organization admin or owner

**Request:**
```json
{
  "description": "Updated description...",
  "annual_capacity": 7500,
  "website": "https://newwebsite.com"
}
```

**Response (200):** Updated organization object.

### POST /organizations/{id}/members
Invite a user to the organization.

**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "operator",
  "permissions": {
    "products.create": true,
    "products.update": true,
    "deals.view_own": true
  }
}
```

**Response (201):**
```json
{
  "id": "mem_xyz789",
  "organization_id": "org_abc456",
  "user_id": null,
  "email": "newuser@example.com",
  "role": "operator",
  "status": "invited",
  "invited_at": "2026-07-31T19:30:00Z",
  "invite_link": "https://app.aatos.trade/invite/abc123"
}
```

---

## 6. Documents (Document Vault)

### POST /documents
Upload a document to the vault.

**Authentication:** Required
**Authorization:** Member of organization
**Content-Type:** `multipart/form-data`

**Request:**
```
POST /v1/documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

--boundary
Content-Disposition: form-data; name="file"; filename="export_license.pdf"
Content-Type: application/pdf

[binary data]
--boundary
Content-Disposition: form-data; name="type"

export_license
--boundary
Content-Disposition: form-data; name="title"

Kenya Export License 2026
--boundary
Content-Disposition: form-data; name="organization_id"

org_abc456
--boundary
Content-Disposition: form-data; name="expiry_date"

2026-12-31
--boundary
Content-Disposition: form-data; name="related_entity_type"

organization
--boundary
Content-Disposition: form-data; name="related_entity_id"

org_abc456
--boundary--
```

**Processing Flow:**
1. File uploaded to temporary S3 bucket
2. Virus scan (ClamAV)
3. AI document processing (extract text, classify, extract fields)
4. Moved to permanent storage
5. Record created in database

**Response (202 Accepted - async processing):**
```json
{
  "id": "doc_xyz789",
  "status": "processing",
  "type": "export_license",
  "title": "Kenya Export License 2026",
  "file_name": "export_license.pdf",
  "file_size_bytes": 245760,
  "mime_type": "application/pdf",
  "organization_id": "org_abc456",
  "expiry_date": "2026-12-31",
  "processing_status": {
    "virus_scan": "pending",
    "ai_extraction": "pending",
    "verification": "pending"
  },
  "created_at": "2026-07-31T19:30:00Z"
}
```

### GET /documents/{id}
Get document details. Returns pre-signed S3 URL for download.

**Response:**
```json
{
  "id": "doc_xyz789",
  "type": "export_license",
  "status": "verified",
  "title": "Kenya Export License 2026",
  "file_name": "export_license.pdf",
  "file_size_bytes": 245760,
  "mime_type": "application/pdf",
  "storage_url": "https://cdn.aatos.trade/documents/org_abc456/doc_xyz789.pdf?X-Amz-Signature=...",
  "expiry_date": "2026-12-31",
  "extracted_data": {
    "license_number": "EXP-KE-2026-001234",
    "issuing_authority": "Kenya Export Promotion Council",
    "valid_from": "2026-01-01",
    "valid_until": "2026-12-31",
    "business_name": "Nairobi Coffee Exporters Ltd",
    "confidence": 0.94
  },
  "verified_at": "2026-02-01T10:00:00Z",
  "verified_by": {
    "id": "usr_admin001",
    "name": "Compliance Officer"
  },
  "created_at": "2026-01-15T08:00:00Z"
}
```

---

## 7. Products

### POST /products
Create a product listing.

**Authentication:** Required
**Authorization:** Organization member with `products.create` permission

**Request:**
```json
{
  "organization_id": "org_abc456",
  "category_id": "cat_coffee_arabica",
  "title": "Kenya AA Arabica Coffee - Washed Process",
  "description": "Premium single-origin coffee from Nyeri region. Washed process, sun-dried on raised beds.",
  "attributes": {
    "variety": "Arabica",
    "grade": "AA",
    "processing": "washed",
    "crop_year": 2026,
    "cupping_score": 87.5,
    "moisture_content": 10.5,
    "defect_count": 2,
    "screen_size": "17/18"
  },
  "origin_country": "KE",
  "origin_region": "Nyeri",
  "harvest_year": 2026,
  "harvest_date": "2026-03-15",
  "available_quantity": 500,
  "available_unit": "mt",
  "moq": 10,
  "moq_unit": "mt",
  "recurring_capacity": true,
  "recurring_frequency": "monthly",
  "price_fob": 4.85,
  "price_cif": 5.45,
  "price_unit": "kg",
  "currency": "USD",
  "price_valid_until": "2026-09-30",
  "packaging_type": "jute_bag",
  "packaging_weight": 60,
  "packaging_unit": "kg",
  "incoterm": "FOB",
  "quality_grade": "AA",
  "certifications": ["organic", "fair_trade"],
  "eligible_countries": ["US", "DE", "NL", "JP", "AE"],
  "warehouse_location": "Nairobi Warehouse, Mombasa Road",
  "warehouse_country": "KE",
  "primary_image_url": "https://cdn.aatos.trade/products/org_abc456/prod_001_main.jpg",
  "image_urls": [
    "https://cdn.aatos.trade/products/org_abc456/prod_001_1.jpg",
    "https://cdn.aatos.trade/products/org_abc456/prod_001_2.jpg"
  ],
  "lab_report_id": "doc_lab_001"
}
```

**Validation:** Attributes validated against `product_categories.attribute_schema` (JSON Schema).

**Response (201):**
```json
{
  "id": "prod_abc123",
  "organization_id": "org_abc456",
  "category_id": "cat_coffee_arabica",
  "title": "Kenya AA Arabica Coffee - Washed Process",
  "status": "pending_review",
  "slug": "kenya-aa-arabica-coffee-washed-process",
  "compliance_score": 0,
  "created_at": "2026-07-31T19:30:00Z",
  "review_queue_position": 15
}
```

### GET /products
Search and filter product listings.

**Query Parameters:**
- `category`: `coffee` or `cat_coffee_arabica`
- `country`: `KE`
- `min_price`: `4.00`
- `max_price`: `6.00`
- `currency`: `USD`
- `certification`: `organic,fair_trade`
- `incoterm`: `FOB`
- `destination`: `DE` (eligible for this destination)
- `verified_only`: `true`
- `in_stock`: `true`
- `q`: `kenya aa arabica`
- `sort`: `-cupping_score` (category attribute sorting)
- `limit`, `after`

**Response:**
```json
{
  "data": [
    {
      "id": "prod_abc123",
      "title": "Kenya AA Arabica Coffee - Washed Process",
      "organization": {
        "id": "org_abc456",
        "name": "Nairobi Coffee Exporters Ltd",
        "country_code": "KE",
        "verification_level": "fully_verified",
        "trust_score": 87
      },
      "category": {
        "id": "cat_coffee_arabica",
        "name": "Arabica Coffee",
        "group": "beverage_crops"
      },
      "attributes": {
        "variety": "Arabica",
        "grade": "AA",
        "processing": "washed",
        "crop_year": 2026,
        "cupping_score": 87.5
      },
      "price_fob": 4.85,
      "price_cif": 5.45,
      "currency": "USD",
      "price_unit": "kg",
      "available_quantity": 500,
      "available_unit": "mt",
      "moq": 10,
      "incoterm": "FOB",
      "origin_country": "KE",
      "certifications": ["organic", "fair_trade"],
      "primary_image_url": "https://cdn.aatos.trade/products/org_abc456/prod_001_main.jpg",
      "compliance_score": 85,
      "status": "published",
      "published_at": "2026-04-01T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "total": 1247,
    "has_more": true,
    "next_cursor": "cursor_prod_789"
  },
  "facets": {
    "categories": [
      {"id": "cat_coffee_arabica", "name": "Arabica Coffee", "count": 523},
      {"id": "cat_coffee_robusta", "name": "Robusta Coffee", "count": 189}
    ],
    "countries": [
      {"code": "KE", "name": "Kenya", "count": 342},
      {"code": "ET", "name": "Ethiopia", "count": 298}
    ],
    "certifications": [
      {"name": "organic", "count": 567},
      {"name": "fair_trade", "count": 423}
    ]
  }
}
```

### GET /products/{id}
Get product detail. Includes compliance eligibility for a destination if specified.

**Query Parameters:**
- `destination`: `DE` (optional, includes compliance checklist for this corridor)

**Response:**
```json
{
  "id": "prod_abc123",
  "title": "Kenya AA Arabica Coffee - Washed Process",
  "organization": { /* ... */ },
  "category": { /* ... */ },
  "attributes": { /* ... */ },
  "pricing": { /* ... */ },
  "compliance": {
    "for_destination": "DE",
    "status": "ready",
    "score": 85,
    "missing_requirements": [],
    "required_documents": [
      {
        "type": "phytosanitary_certificate",
        "status": "available",
        "document_id": "doc_pht_001"
      },
      {
        "type": "certificate_of_origin",
        "status": "available",
        "document_id": "doc_coo_001"
      },
      {
        "type": "organic_certificate",
        "status": "available",
        "document_id": "doc_org_001"
      }
    ],
    "estimated_time_days": 5,
    "estimated_cost_usd": 450
  }
}
```

### GET /products/{id}/compliance
Get compliance checklist for a product across all destinations or a specific corridor.

**Query Parameters:**
- `destination`: `DE` (optional)

**Response:**
```json
{
  "product_id": "prod_abc123",
  "origin_country": "KE",
  "checklists": [
    {
      "destination_country": "DE",
      "destination_name": "Germany",
      "overall_status": "ready",
      "completion_percent": 100,
      "items": [
        {
          "requirement_type": "document",
          "requirement": "Phytosanitary Certificate",
          "status": "completed",
          "document_id": "doc_pht_001",
          "responsible_party": "exporter"
        }
      ]
    },
    {
      "destination_country": "US",
      "destination_name": "United States",
      "overall_status": "pending",
      "completion_percent": 60,
      "items": [
        {
          "requirement_type": "document",
          "requirement": "FDA Registration",
          "status": "pending",
          "responsible_party": "exporter"
        }
      ]
    }
  ]
}
```

---

## 8. RFQ (Request for Quotation)

### POST /rfqs
Create a new sourcing request.

**Authentication:** Required
**Authorization:** Buyer organization member

**Request:**
```json
{
  "title": "Arabica Coffee AA Grade - 100MT Annual Contract",
  "description": "Seeking premium Kenya AA Arabica for German specialty roaster. Annual requirement.",
  "product_category_id": "cat_coffee_arabica",
  "specifications": {
    "grade": "AA",
    "processing": ["washed", "natural"],
    "cupping_score_min": 85,
    "crop_year": [2025, 2026],
    "certifications_required": ["organic"]
  },
  "required_quantity": 100,
  "required_unit": "mt",
  "frequency": "monthly",
  "destination_country": "DE",
  "destination_city": "Hamburg",
  "delivery_date_start": "2026-09-01",
  "delivery_date_end": "2026-12-31",
  "response_deadline": "2026-08-15T23:59:59Z",
  "target_price": 5.20,
  "target_price_currency": "USD",
  "preferred_incoterm": "CIF",
  "payment_terms": "30% advance, 70% against B/L",
  "required_certifications": ["organic", "fair_trade"],
  "is_public": true
}
```

**Response (201):**
```json
{
  "id": "rfq_abc789",
  "status": "published",
  "title": "Arabica Coffee AA Grade - 100MT Annual Contract",
  "buyer_org_id": "org_buyer_001",
  "matched_supplier_count": 23,
  "compliance_checklist_id": "chk_001",
  "published_at": "2026-07-31T19:30:00Z",
  "response_deadline": "2026-08-15T23:59:59Z"
}
```

### GET /rfqs
List RFQs (buyer sees own; supplier sees matched public ones).

**Response:** List of RFQ summaries.

### POST /rfqs/{id}/quotes
Submit a quotation in response to an RFQ.

**Request:**
```json
{
  "supplier_org_id": "org_abc456",
  "product_id": "prod_abc123",
  "unit_price": 5.10,
  "price_currency": "USD",
  "price_per_unit": "kg",
  "total_price": 510000,
  "quantity_offered": 100,
  "quantity_unit": "mt",
  "incoterm": "CIF",
  "delivery_time_days": 45,
  "payment_terms": "30% advance, 70% CAD",
  "validity_days": 21,
  "quality_grade": "AA",
  "packaging_details": "60kg jute bags with grainpro liners",
  "specifications": {
    "crop_year": 2026,
    "cupping_score": 88,
    "moisture_content": 10.2
  },
  "supplier_notes": "Available for immediate shipment from Mombasa port"
}
```

**Response (201):**
```json
{
  "id": "quote_xyz123",
  "status": "sent",
  "rfq_id": "rfq_abc789",
  "supplier_org_id": "org_abc456",
  "unit_price": 5.10,
  "total_price": 510000,
  "valid_until": "2026-08-21",
  "sent_at": "2026-07-31T19:30:00Z"
}
```

---

## 9. Deals (Deal Rooms)

### POST /deals
Create a deal from a quotation (or direct negotiation).

**Authentication:** Required
**Authorization:** Buyer or supplier org member

**Request:**
```json
{
  "buyer_org_id": "org_buyer_001",
  "supplier_org_id": "org_abc456",
  "rfq_id": "rfq_abc789",
  "winning_quotation_id": "quote_xyz123",
  "title": "Kenya AA Coffee - 100MT to Hamburg",
  "description": "Annual contract for premium Arabica",
  "product_category_id": "cat_coffee_arabica",
  "agreed_quantity": 100,
  "quantity_unit": "mt",
  "agreed_price": 5.10,
  "price_currency": "USD",
  "incoterm": "CIF",
  "payment_terms": "30% advance, 70% CAD",
  "delivery_date": "2026-10-15",
  "inspection_required": true,
  "payment_method": "escrow",
  "milestones": [
    {
      "milestone_type": "contract_signing",
      "sequence_order": 1,
      "scheduled_date": "2026-08-10"
    },
    {
      "milestone_type": "advance_payment",
      "sequence_order": 2,
      "payment_percentage": 30.00,
      "payment_amount": 153000,
      "payment_currency": "USD",
      "scheduled_date": "2026-08-15"
    },
    {
      "milestone_type": "inspection_completion",
      "sequence_order": 3,
      "scheduled_date": "2026-09-20"
    },
    {
      "milestone_type": "shipment_booking",
      "sequence_order": 4,
      "scheduled_date": "2026-09-25"
    },
    {
      "milestone_type": "main_payment",
      "sequence_order": 5,
      "payment_percentage": 70.00,
      "payment_amount": 357000,
      "payment_currency": "USD",
      "scheduled_date": "2026-10-01"
    },
    {
      "milestone_type": "delivery_confirmation",
      "sequence_order": 6,
      "scheduled_date": "2026-10-15"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "deal_abc999",
  "status": "negotiating",
  "buyer_org_id": "org_buyer_001",
  "supplier_org_id": "org_abc456",
  "title": "Kenya AA Coffee - 100MT to Hamburg",
  "total_value_usd": 510000,
  "milestones": [
    {
      "id": "ms_001",
      "milestone_type": "contract_signing",
      "status": "pending",
      "sequence_order": 1
    }
  ],
  "compliance_checklist_id": "chk_deal_001",
  "created_at": "2026-07-31T19:30:00Z"
}
```

### GET /deals/{id}
Get deal room details (full view for participants).

**Response:**
```json
{
  "id": "deal_abc999",
  "status": "contract_signed",
  "title": "Kenya AA Coffee - 100MT to Hamburg",
  "buyer": {
    "id": "org_buyer_001",
    "name": "Hamburg Specialty Roasters GmbH",
    "country_code": "DE",
    "verification_level": "fully_verified"
  },
  "supplier": {
    "id": "org_abc456",
    "name": "Nairobi Coffee Exporters Ltd",
    "country_code": "KE",
    "verification_level": "fully_verified"
  },
  "commercial_terms": {
    "agreed_quantity": 100,
    "quantity_unit": "mt",
    "agreed_price": 5.10,
    "price_currency": "USD",
    "incoterm": "CIF",
    "payment_terms": "30% advance, 70% CAD",
    "delivery_date": "2026-10-15"
  },
  "milestones": [
    {
      "id": "ms_001",
      "milestone_type": "contract_signing",
      "status": "completed",
      "completed_at": "2026-08-10T14:30:00Z",
      "evidence_document_id": "doc_contract_001"
    },
    {
      "id": "ms_002",
      "milestone_type": "advance_payment",
      "status": "completed",
      "payment_amount": 153000,
      "completed_at": "2026-08-15T09:00:00Z"
    },
    {
      "id": "ms_003",
      "milestone_type": "inspection_completion",
      "status": "in_progress",
      "scheduled_date": "2026-09-20"
    }
  ],
  "compliance": {
    "checklist_id": "chk_deal_001",
    "overall_status": "in_progress",
    "completion_percent": 67
  },
  "messages_count": 34,
  "documents_count": 12,
  "total_value_usd": 510000,
  "platform_fee_usd": 5100,
  "created_at": "2026-07-31T19:30:00Z",
  "contract_signed_at": "2026-08-10T14:30:00Z"
}
```

### PATCH /deals/{id}/milestones/{milestone_id}
Update milestone status (e.g., mark as completed, upload evidence).

**Request:**
```json
{
  "status": "completed",
  "evidence_document_id": "doc_inspection_001",
  "notes": "Pre-shipment inspection passed. Quality verified as AA grade."
}
```

**Response:** Updated milestone with triggered next steps (e.g., payment release).

---

## 10. Messages

### POST /messages
Send a message in a deal or RFQ context.

**Request:**
```json
{
  "deal_id": "deal_abc999",
  "content": "The inspection report looks good. We approve the quality. Please proceed with shipment booking.",
  "message_type": "text",
  "attachment_document_id": null
}
```

**Response (201):**
```json
{
  "id": "msg_001",
  "deal_id": "deal_abc999",
  "sender_org_id": "org_buyer_001",
  "sender_user_id": "usr_buyer_001",
  "sender_name": "Hans Mueller",
  "sender_org_name": "Hamburg Specialty Roasters GmbH",
  "message_type": "text",
  "content": "The inspection report looks good. We approve the quality. Please proceed with shipment booking.",
  "original_language": "en",
  "translated_content": {
    "sw": "Ripoti ya ukaguzi inaonekana nzuri. Tunakubali ubora. Tafadhali endelea na kuhifadhi usafirishaji."
  },
  "created_at": "2026-07-31T19:30:00Z"
}
```

### GET /deals/{id}/messages
Get messages for a deal room.

**Query Parameters:**
- `limit`: `50` (default)
- `before`: `cursor_msg_123` (older messages)
- `after`: `cursor_msg_456` (newer messages)

**Response:**
```json
{
  "data": [
    {
      "id": "msg_003",
      "sender_org_id": "org_buyer_001",
      "sender_name": "Hans Mueller",
      "sender_org_name": "Hamburg Specialty Roasters GmbH",
      "content": "The inspection report looks good...",
      "created_at": "2026-07-31T19:30:00Z",
      "read_by": {
        "usr_supplier_001": "2026-07-31T19:35:00Z"
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "has_more": true,
    "next_cursor": "cursor_msg_002",
    "previous_cursor": null
  }
}
```

---

## 11. Compliance

### GET /compliance/rules
List compliance rules (admin only; filtered view for public).

**Query Parameters:**
- `origin`: `KE`
- `destination`: `DE`
- `category`: `coffee`
- `requirement_type`: `document`
- `status`: `active`

**Response:** List of compliance rules.

### POST /compliance/check
Generate a compliance checklist for a specific context.

**Request:**
```json
{
  "origin_country": "KE",
  "destination_country": "DE",
  "product_category_id": "cat_coffee_arabica",
  "entity_type": "product",
  "entity_id": "prod_abc123"
}
```

**Response:**
```json
{
  "checklist_id": "chk_001",
  "origin_country": "KE",
  "destination_country": "DE",
  "overall_status": "ready",
  "completion_percent": 100,
  "items": [
    {
      "id": "chk_item_001",
      "requirement_type": "document",
      "requirement": "Phytosanitary Certificate",
      "status": "completed",
      "document_id": "doc_pht_001",
      "responsible_party": "exporter",
      "estimated_cost_usd": 150,
      "estimated_time_days": 3
    }
  ],
  "estimated_total_cost_usd": 450,
  "estimated_total_time_days": 5
}
```

---

## 12. WebSocket Events (Real-time)

Connect to `wss://realtime.aatos.trade/v1` with Bearer token.

### Subscribe to Deal Events
```json
{
  "action": "subscribe",
  "channel": "deal:deal_abc999",
  "events": ["message", "milestone_update", "payment_update", "inspection_update"]
}
```

### Event Payload Example
```json
{
  "event": "milestone_update",
  "channel": "deal:deal_abc999",
  "data": {
    "milestone_id": "ms_003",
    "milestone_type": "inspection_completion",
    "status": "completed",
    "completed_at": "2026-09-20T11:00:00Z",
    "next_milestone": {
      "id": "ms_004",
      "milestone_type": "shipment_booking",
      "status": "pending"
    }
  },
  "timestamp": "2026-09-20T11:00:05Z"
}
```

---

## 13. Rate Limits

| Endpoint Group | Standard Tier | Enterprise Tier |
|---|---|---|
| Auth | 20/min | 100/min |
| Read (GET) | 100/min | 1000/min |
| Write (POST/PUT/PATCH) | 50/min | 500/min |
| Search | 30/min | 300/min |
| Uploads | 10/min | 100/min |
| WebSocket | 100 conn | 1000 conn |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1690857600
```

---

## 14. Versioning

API versions are URL-based: `/v1/`, `/v2/`, etc.

Deprecated versions return:
```
Sunset: Wed, 31 Dec 2026 23:59:59 GMT
Deprecation: true
```

---

*AATOS API Specification v1.0 | For Internal Development*
