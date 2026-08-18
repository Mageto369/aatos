-- ═══════════════════════════════════════════════════════════════════════════════
-- AATOS — Core Database Schema (PostgreSQL 16)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Design Goals:
--   - Support 100M+ organizations, 1B+ products, 100M+ transactions
--   - Soft deletes on all tables
--   - Immutable audit trails
--   - Partitioning for hot tables (audit_logs, messages, events)
--   - JSONB for category-specific flexible attributes
--   - Row-level security for multi-tenant data isolation
--   - Full-text search via generated columns
-- ═══════════════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 0. EXTENSIONS & CONFIGURATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- GIN index for enums
CREATE EXTENSION IF NOT EXISTS "citext";         -- case-insensitive text

-- Enable RLS globally
ALTER SYSTEM SET row_security = on;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. ENUMERATIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TYPE org_type AS ENUM (
    'farmer', 'cooperative', 'aggregator', 'processor', 'manufacturer',
    'exporter', 'trader', 'importer', 'distributor', 'retailer',
    'hospitality', 'government', 'ngo', 'lab', 'inspector', 'certifier',
    'freight_forwarder', 'customs_broker', 'warehouse', 'insurer', 'bank',
    'trade_finance', 'consultant', 'platform_admin'
);

CREATE TYPE org_status AS ENUM (
    'draft', 'pending_verification', 'verified', 'suspended', 'rejected', 'inactive'
);

CREATE TYPE verification_level AS ENUM (
    'none', 'email_phone', 'business_registration', 'physical_site', 
    'banking_verified', 'trade_references', 'fully_verified'
);

CREATE TYPE user_role AS ENUM (
    'owner', 'admin', 'operator', 'agent', 'viewer', 'compliance_officer',
    'finance_officer', 'logistics_officer', 'support'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'invited');

CREATE TYPE document_type AS ENUM (
    'business_registration', 'export_license', 'import_license',
    'phytosanitary_certificate', 'certificate_of_origin', 'quality_certificate',
    'organic_certificate', 'fair_trade_certificate', 'bank_statement',
    'tax_certificate', 'identity_document', 'inspection_report',
    'lab_report', 'contract', 'invoice', 'bill_of_lading', 'insurance_policy',
    'customs_declaration', 'packing_list', 'other'
);

CREATE TYPE document_status AS ENUM (
    'uploaded', 'pending_review', 'verified', 'rejected', 'expired', 'revoked'
);

CREATE TYPE product_status AS ENUM ('draft', 'pending_review', 'published', 'unpublished', 'archived');

CREATE TYPE product_category_group AS ENUM (
    'beverage_crops', 'fresh_produce', 'dry_commodities', 'spices_botanicals',
    'animal_products', 'seafood', 'processed_products', 'other'
);

CREATE TYPE rfq_status AS ENUM (
    'draft', 'published', 'matching', 'reviewing_quotes', 'negotiating',
    'awarded', 'expired', 'cancelled'
);

CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'under_review', 'accepted', 'rejected', 'expired');

CREATE TYPE deal_status AS ENUM (
    'negotiating', 'contract_pending', 'contract_signed', 'inspection_scheduled',
    'inspection_passed', 'inspection_failed', 'payment_pending', 'payment_received',
    'shipment_booked', 'in_transit', 'customs_clearance', 'delivered',
    'completed', 'disputed', 'cancelled'
);

CREATE TYPE milestone_type AS ENUM (
    'contract_signing', 'advance_payment', 'inspection_booking', 'inspection_completion',
    'shipment_booking', 'document_submission', 'main_payment', 'delivery_confirmation',
    'final_payment', 'dispute_resolution'
);

CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'overdue');

CREATE TYPE payment_method AS ENUM (
    'bank_transfer', 'escrow', 'letter_of_credit', 'documentary_collection',
    'advance_payment', 'installment', 'trade_finance'
);

CREATE TYPE payment_status AS ENUM ('pending', 'held', 'released', 'refunded', 'failed', 'disputed');

CREATE TYPE compliance_requirement_type AS ENUM (
    'document', 'inspection', 'laboratory_test', 'certification', 'registration',
    'label', 'permit', 'fee', 'tax'
);

CREATE TYPE inspection_type AS ENUM (
    'farm', 'facility', 'warehouse', 'packing', 'port', 'pre_shipment', 'destination'
);

CREATE TYPE inspection_result AS ENUM ('pending', 'pass', 'fail', 'conditional', 'waiver');

CREATE TYPE message_type AS ENUM ('text', 'file', 'quote', 'contract', 'system', 'translation');

CREATE TYPE audit_action AS ENUM (
    'created', 'updated', 'deleted', 'verified', 'rejected', 'approved',
    'signed', 'paid', 'shipped', 'delivered', 'viewed', 'downloaded',
    'messaged', 'matched', 'escalated'
);

CREATE TYPE currency_code AS ENUM (
    'USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KES', 'NGN', 'ETB', 'GHS', 'TZS',
    'ZAR', 'UGX', 'RWF', 'ZMW', 'XOF', 'XAF', 'AED', 'SAR', 'INR', 'BRL'
);

CREATE TYPE unit_of_measure AS ENUM (
    'kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft',
    'liter', 'gallon', 'piece', 'dozen', 'pallet'
);

CREATE TYPE incoterm AS ENUM ('EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. ORGANIZATIONS & IDENTITY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE organizations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    name                CITEXT NOT NULL,
    legal_name          CITEXT,
    slug                CITEXT UNIQUE NOT NULL,
    type                org_type NOT NULL,
    status              org_status NOT NULL DEFAULT 'draft',
    verification_level  verification_level NOT NULL DEFAULT 'none',
    
    -- Location
    country_code        CHAR(2) NOT NULL,          -- ISO 3166-1 alpha-2
    region              VARCHAR(100),
    city                VARCHAR(100),
    address             TEXT,
    postal_code         VARCHAR(20),
    latitude            DECIMAL(10, 8),
    longitude           DECIMAL(11, 8),
    
    -- Business Details
    registration_number VARCHAR(100),
    tax_id              VARCHAR(100),
    year_established    SMALLINT,
    employee_count      VARCHAR(20),               -- e.g. "11-50"
    website             VARCHAR(255),
    description         TEXT,
    
    -- Capacity (supply-side)
    annual_capacity     DECIMAL(18, 4),            -- in MT or units
    capacity_unit       unit_of_measure,
    processing_capacity BOOLEAN DEFAULT FALSE,
    storage_capacity    BOOLEAN DEFAULT FALSE,
    cold_chain          BOOLEAN DEFAULT FALSE,
    
    -- Verification Scores
    profile_completeness SMALLINT DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
    risk_score          SMALLINT DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
    trust_score         SMALLINT DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
    
    -- Banking
    bank_name           VARCHAR(200),
    bank_account_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    primary_contact_user_id UUID,
    referral_code       VARCHAR(50),
    referred_by_org_id  UUID REFERENCES organizations(id),
    
    -- Settings
    timezone            VARCHAR(50) DEFAULT 'UTC',
    locale              VARCHAR(10) DEFAULT 'en',
    currency_preference currency_code DEFAULT 'USD',
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,               -- soft delete
    created_by          UUID,
    updated_by          UUID,
    
    -- Full-text search
    search_vector       TSVECTOR
);

-- Indexes
CREATE INDEX idx_org_country ON organizations(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_type ON organizations(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_status ON organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_verification ON organizations(verification_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_risk_score ON organizations(risk_score) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_trust_score ON organizations(trust_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_geo ON organizations USING GIST (
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_org_search ON organizations USING GIN(search_vector);
CREATE INDEX idx_org_referred_by ON organizations(referred_by_org_id) WHERE deleted_at IS NULL;

-- Full-text search trigger
CREATE OR REPLACE FUNCTION org_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.legal_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.country_code, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_search_trigger
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION org_search_update();

-- Row-level security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON organizations
    FOR ALL
    USING (deleted_at IS NULL);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. USERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email               CITEXT UNIQUE NOT NULL,
    email_verified      BOOLEAN DEFAULT FALSE,
    email_verified_at   TIMESTAMPTZ,
    phone               VARCHAR(30),
    phone_verified      BOOLEAN DEFAULT FALSE,
    phone_verified_at   TIMESTAMPTZ,
    
    -- Profile
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    display_name        VARCHAR(200),
    avatar_url          VARCHAR(500),
    
    -- Security
    password_hash       VARCHAR(255),              -- nullable for SSO-only users
    mfa_enabled         BOOLEAN DEFAULT FALSE,
    mfa_secret          VARCHAR(255),              -- encrypted
    last_login_at       TIMESTAMPTZ,
    login_count         INTEGER DEFAULT 0,
    failed_login_count  INTEGER DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    
    -- Status
    status              user_status NOT NULL DEFAULT 'invited',
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    
    -- Search
    search_vector       TSVECTOR
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_search ON users USING GIN(search_vector);

CREATE OR REPLACE FUNCTION user_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_search_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION user_search_update();

ALTER TABLE organizations
    ADD CONSTRAINT fk_org_primary_contact
    FOREIGN KEY (primary_contact_user_id) REFERENCES users(id)
    DEFERRABLE INITIALLY DEFERRED;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. ORGANIZATION MEMBERSHIPS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE organization_members (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                user_role NOT NULL DEFAULT 'viewer',
    
    -- Permissions (override role defaults)
    permissions         JSONB DEFAULT '{}',         -- e.g. {"products.create": true, "deals.view_all": true}
    
    -- Status
    is_primary_contact  BOOLEAN DEFAULT FALSE,
    invited_by          UUID REFERENCES users(id),
    invited_at          TIMESTAMPTZ,
    joined_at           TIMESTAMPTZ,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_user ON organization_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_role ON organization_members(role) WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. DOCUMENTS (Document Vault)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ownership
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Document Details
    type                document_type NOT NULL,
    status              document_status NOT NULL DEFAULT 'uploaded',
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    
    -- File Storage
    file_name           VARCHAR(255) NOT NULL,
    file_size_bytes     BIGINT NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    storage_key         VARCHAR(500) NOT NULL,     -- S3 object key
    storage_bucket      VARCHAR(100) NOT NULL DEFAULT 'aatos-documents',
    
    -- Document Intelligence (AI-extracted)
    extracted_data      JSONB,                     -- AI-extracted fields
    extraction_confidence DECIMAL(4,3),            -- 0.000 to 1.000
    extracted_text      TEXT,                      -- OCR text
    
    -- Verification
    verified_by_user_id UUID REFERENCES users(id),
    verified_at         TIMESTAMPTZ,
    verification_notes  TEXT,
    
    -- Validity
    issue_date          DATE,
    expiry_date         DATE,
    issuing_authority   VARCHAR(255),
    document_number     VARCHAR(255),
    
    -- Related entities (polymorphic)
    related_entity_type VARCHAR(50),               -- 'product', 'deal', 'organization'
    related_entity_id   UUID,
    
    -- Metadata
    tags                TEXT[],
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_docs_org ON documents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_type ON documents(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_status ON documents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_expiry ON documents(expiry_date) WHERE deleted_at IS NULL AND expiry_date IS NOT NULL;
CREATE INDEX idx_docs_related ON documents(related_entity_type, related_entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_extracted ON documents USING GIN(extracted_data) WHERE deleted_at IS NULL;

-- Expiry alert view
CREATE VIEW expiring_documents AS
SELECT 
    d.*,
    o.name as organization_name,
    o.primary_contact_user_id
FROM documents d
JOIN organizations o ON d.organization_id = o.id
WHERE d.deleted_at IS NULL
  AND d.expiry_date IS NOT NULL
  AND d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND d.status IN ('verified', 'uploaded');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. PRODUCT CATEGORIES & TAXONOMY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE product_categories (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Hierarchy
    parent_id           UUID REFERENCES product_categories(id),
    group_type          product_category_group NOT NULL,
    
    -- Identity
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) UNIQUE NOT NULL,
    code                VARCHAR(20) UNIQUE NOT NULL,   -- e.g. "COF-ARAB", "AVO-HASS"
    
    -- Description
    description         TEXT,
    hs_code             VARCHAR(20),                     -- Harmonized System code
    
    -- Category-Specific Attribute Schema (JSON Schema)
    attribute_schema    JSONB NOT NULL DEFAULT '{}',     -- JSON Schema for validation
    
    -- Compliance defaults
    default_compliance_rules JSONB DEFAULT '[]',
    
    -- Display
    icon_url            VARCHAR(500),
    image_url           VARCHAR(500),
    sort_order          INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cat_parent ON product_categories(parent_id);
CREATE INDEX idx_cat_group ON product_categories(group_type);
CREATE INDEX idx_cat_active ON product_categories(is_active) WHERE is_active = TRUE;

-- Category Attribute Definitions (for UI generation)
CREATE TABLE product_category_attributes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id         UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    
    name                VARCHAR(100) NOT NULL,
    key                 VARCHAR(100) NOT NULL,       -- machine name
    data_type           VARCHAR(50) NOT NULL,        -- 'string', 'number', 'boolean', 'enum', 'date', 'range'
    
    -- Configuration
    is_required         BOOLEAN DEFAULT FALSE,
    is_filterable       BOOLEAN DEFAULT FALSE,
    is_searchable       BOOLEAN DEFAULT FALSE,
    is_displayable      BOOLEAN DEFAULT TRUE,
    
    -- For enums
    options             JSONB,                       -- [{"value": "AA", "label": "Grade AA"}, ...]
    
    -- Validation
    min_value           DECIMAL(18, 6),
    max_value           DECIMAL(18, 6),
    unit                VARCHAR(50),                 -- e.g. "%", "mg/kg", "°C"
    
    -- UI
    input_type          VARCHAR(50) DEFAULT 'text',  -- 'text', 'number', 'select', 'multiselect', 'date', 'file'
    help_text           TEXT,
    sort_order          INTEGER DEFAULT 0,
    
    UNIQUE(category_id, key)
);

CREATE INDEX idx_cat_attrs_category ON product_category_attributes(category_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. PRODUCTS (Listings)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ownership
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    created_by_user_id  UUID NOT NULL REFERENCES users(id),
    
    -- Classification
    category_id         UUID NOT NULL REFERENCES product_categories(id),
    
    -- Identity
    title               VARCHAR(255) NOT NULL,
    slug                VARCHAR(255),
    description         TEXT,
    
    -- Category-Specific Attributes (flexible JSONB)
    attributes          JSONB NOT NULL DEFAULT '{}',
    -- Example for coffee: {"variety": "Arabica", "grade": "AA", "processing": "washed", "crop_year": 2026, "cupping_score": 87.5}
    -- Example for avocados: {"variety": "Hass", "size_grade": "14", "dry_matter": 23.5, "harvest_date": "2026-07-15"}
    
    -- Specifications
    origin_country      CHAR(2) NOT NULL,
    origin_region       VARCHAR(100),
    harvest_year        SMALLINT,
    harvest_date        DATE,
    
    -- Availability
    available_quantity  DECIMAL(18, 4) NOT NULL,
    available_unit      unit_of_measure NOT NULL,
    moq                 DECIMAL(18, 4),              -- Minimum Order Quantity
    moq_unit            unit_of_measure,
    recurring_capacity  BOOLEAN DEFAULT FALSE,        -- Can supply regularly
    recurring_frequency VARCHAR(50),                   -- e.g. "monthly", "quarterly"
    
    -- Pricing
    price_fob           DECIMAL(18, 4),              -- Free On Board
    price_cif           DECIMAL(18, 4),              -- Cost Insurance Freight
    price_unit          unit_of_measure,
    currency            currency_code DEFAULT 'USD',
    price_valid_until   DATE,
    
    -- Packaging & Shipping
    packaging_type      VARCHAR(100),                -- e.g. "jute_bag", "carton", "vacuum_pack"
    packaging_weight    DECIMAL(10, 4),
    packaging_unit      unit_of_measure,
    incoterm            incoterm DEFAULT 'FOB',
    
    -- Quality & Certifications
    quality_grade       VARCHAR(50),
    certifications      TEXT[],                      -- ['organic', 'fair_trade', 'rainforest_alliance']
    lab_report_id       UUID REFERENCES documents(id),
    
    -- Eligibility
    eligible_countries  CHAR(2)[],                   -- ISO country codes
    restricted_countries CHAR(2)[],
    
    -- Status
    status              product_status NOT NULL DEFAULT 'draft',
    is_featured         BOOLEAN DEFAULT FALSE,
    view_count          INTEGER DEFAULT 0,
    inquiry_count       INTEGER DEFAULT 0,
    
    -- Location
    warehouse_location  VARCHAR(255),
    warehouse_country   CHAR(2),
    
    -- Media
    primary_image_url   VARCHAR(500),
    image_urls          TEXT[],
    video_urls          TEXT[],
    
    -- Compliance Score (computed from category + destination rules)
    compliance_score    SMALLINT DEFAULT 0 CHECK (compliance_score BETWEEN 0 AND 100),
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,
    
    -- Full-text search
    search_vector       TSVECTOR
);

-- Indexes
CREATE INDEX idx_products_org ON products(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_country ON products(origin_country) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_price ON products(price_fob) WHERE deleted_at IS NULL AND status = 'published';
CREATE INDEX idx_products_compliance ON products(compliance_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE deleted_at IS NULL AND status = 'published';
CREATE INDEX idx_products_attributes ON products USING GIN(attributes) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION product_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.quality_grade, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.origin_country, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_search_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION product_search_update();

-- Update published_at automatically
CREATE OR REPLACE FUNCTION product_publish_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_publish_trigger
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION product_publish_timestamp();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. COMPLIANCE ENGINE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE compliance_rules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Corridor
    origin_country      CHAR(2) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    product_category_id UUID REFERENCES product_categories(id),
    
    -- Requirement
    requirement_type    compliance_requirement_type NOT NULL,
    requirement         TEXT NOT NULL,               -- e.g. "Phytosanitary Certificate"
    description         TEXT,
    
    -- Responsibility
    responsible_party   VARCHAR(50) NOT NULL,        -- 'exporter', 'importer', 'carrier', 'both'
    
    -- Issuing Authority
    issuing_authority   VARCHAR(255),
    issuing_authority_country CHAR(2),
    
    -- Timing & Cost
    estimated_time_days INTEGER,
    estimated_cost_usd  DECIMAL(12, 2),
    validity_period     VARCHAR(50),                 -- 'shipment-specific', 'annual', 'perennial'
    
    -- Verification
    verification_method VARCHAR(255),                -- e.g. "Document + issuing-body check"
    required_document_type document_type,
    
    -- Source & Governance
    source_url          VARCHAR(500),
    source_name         VARCHAR(255),
    reviewed_at         DATE NOT NULL DEFAULT CURRENT_DATE,
    reviewed_by         UUID REFERENCES users(id),
    rule_status         VARCHAR(20) DEFAULT 'active', -- 'active', 'under_review', 'retired'
    rule_version        INTEGER NOT NULL DEFAULT 1,
    
    -- Metadata
    tags                TEXT[],
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(origin_country, destination_country, product_category_id, requirement_type, requirement, rule_version)
);

CREATE INDEX idx_comp_rules_corridor ON compliance_rules(origin_country, destination_country);
CREATE INDEX idx_comp_rules_category ON compliance_rules(product_category_id);
CREATE INDEX idx_comp_rules_type ON compliance_rules(requirement_type);
CREATE INDEX idx_comp_rules_status ON compliance_rules(rule_status) WHERE rule_status = 'active';

-- Compliance Checklist (generated per transaction/product-destination pair)
CREATE TABLE compliance_checklists (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    entity_type         VARCHAR(50) NOT NULL,        -- 'product', 'rfq', 'deal'
    entity_id           UUID NOT NULL,
    
    origin_country      CHAR(2) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    
    -- Generated from rules
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by_rules  UUID[],                      -- references compliance_rules
    
    -- Status
    overall_status      VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'complete', 'blocked'
    completion_percent  SMALLINT DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklists_entity ON compliance_checklists(entity_type, entity_id);
CREATE INDEX idx_checklists_corridor ON compliance_checklists(origin_country, destination_country);

-- Compliance Checklist Items
CREATE TABLE compliance_checklist_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id        UUID NOT NULL REFERENCES compliance_checklists(id) ON DELETE CASCADE,
    rule_id             UUID REFERENCES compliance_rules(id),
    
    requirement_type    compliance_requirement_type NOT NULL,
    requirement         TEXT NOT NULL,
    description         TEXT,
    responsible_party   VARCHAR(50) NOT NULL,
    
    -- Status
    status              VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'waived', 'failed'
    
    -- Evidence
    document_id         UUID REFERENCES documents(id),
    evidence_notes      TEXT,
    completed_by        UUID REFERENCES users(id),
    completed_at        TIMESTAMPTZ,
    
    -- Cost & Time tracking
    actual_cost_usd     DECIMAL(12, 2),
    actual_time_days    INTEGER,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_checklist ON compliance_checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_status ON compliance_checklist_items(status);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9. RFQ (Request for Quotation)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE rfqs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Buyer
    buyer_org_id        UUID NOT NULL REFERENCES organizations(id),
    created_by_user_id  UUID NOT NULL REFERENCES users(id),
    
    -- Requirements
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    
    product_category_id UUID NOT NULL REFERENCES product_categories(id),
    specifications      JSONB NOT NULL DEFAULT '{}', -- Flexible requirements
    
    -- Quantity
    required_quantity   DECIMAL(18, 4) NOT NULL,
    required_unit       unit_of_measure NOT NULL,
    frequency           VARCHAR(50),                 -- 'one_time', 'monthly', 'quarterly', 'annual'
    
    -- Destination
    destination_country CHAR(2) NOT NULL,
    destination_city    VARCHAR(100),
    
    -- Timeline
    delivery_date_start DATE,
    delivery_date_end   DATE,
    response_deadline   TIMESTAMPTZ NOT NULL,
    
    -- Commercial Terms
    target_price        DECIMAL(18, 4),
    target_price_currency currency_code DEFAULT 'USD',
    preferred_incoterm  incoterm,
    payment_terms       VARCHAR(100),                -- e.g. "30% advance, 70% CAD"
    
    -- Certifications Required
    required_certifications TEXT[],
    
    -- Status
    status              rfq_status NOT NULL DEFAULT 'draft',
    
    -- Matching
    matched_supplier_count INTEGER DEFAULT 0,
    quote_received_count   INTEGER DEFAULT 0,
    
    -- Visibility
    is_public           BOOLEAN DEFAULT FALSE,       -- FALSE = invite-only to matched suppliers
    invited_supplier_ids UUID[],
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,
    
    search_vector       TSVECTOR
);

CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_category ON rfqs(product_category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_status ON rfqs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_deadline ON rfqs(response_deadline) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_destination ON rfqs(destination_country) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_search ON rfqs USING GIN(search_vector);

CREATE OR REPLACE FUNCTION rfq_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfq_search_trigger
    BEFORE INSERT OR UPDATE ON rfqs
    FOR EACH ROW
    EXECUTE FUNCTION rfq_search_update();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10. QUOTATIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE quotations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Links
    rfq_id              UUID NOT NULL REFERENCES rfqs(id),
    supplier_org_id     UUID NOT NULL REFERENCES organizations(id),
    product_id          UUID REFERENCES products(id),
    created_by_user_id  UUID NOT NULL REFERENCES users(id),
    
    -- Pricing
    unit_price          DECIMAL(18, 4) NOT NULL,
    price_currency      currency_code DEFAULT 'USD',
    price_per_unit      unit_of_measure NOT NULL,
    total_price         DECIMAL(18, 4) NOT NULL,
    
    -- Terms
    quantity_offered    DECIMAL(18, 4) NOT NULL,
    quantity_unit       unit_of_measure NOT NULL,
    incoterm            incoterm NOT NULL,
    delivery_time_days  INTEGER,
    payment_terms       VARCHAR(255),
    validity_days       INTEGER DEFAULT 30,
    valid_until         DATE,
    
    -- Specifications
    quality_grade       VARCHAR(50),
    packaging_details   TEXT,
    specifications      JSONB DEFAULT '{}',
    
    -- Status
    status              quotation_status NOT NULL DEFAULT 'draft',
    
    -- Negotiation
    buyer_notes         TEXT,
    supplier_notes      TEXT,
    counter_offer       JSONB,                     -- Previous quote + changes
    negotiation_round   INTEGER DEFAULT 1,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at             TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_quotes_rfqs ON quotations(rfq_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_supplier ON quotations(supplier_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_status ON quotations(status) WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 11. DEALS (Deal Rooms)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE deals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parties
    buyer_org_id        UUID NOT NULL REFERENCES organizations(id),
    supplier_org_id     UUID NOT NULL REFERENCES organizations(id),
    rfq_id              UUID REFERENCES rfqs(id),
    winning_quotation_id UUID REFERENCES quotations(id),
    
    -- Overview
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    
    product_category_id UUID NOT NULL REFERENCES product_categories(id),
    
    -- Commercial Terms
    agreed_quantity     DECIMAL(18, 4) NOT NULL,
    quantity_unit       unit_of_measure NOT NULL,
    agreed_price        DECIMAL(18, 4) NOT NULL,
    price_currency      currency_code DEFAULT 'USD',
    incoterm            incoterm NOT NULL,
    payment_terms       VARCHAR(255),
    delivery_date       DATE,
    
    -- Status Pipeline
    status              deal_status NOT NULL DEFAULT 'negotiating',
    
    -- Compliance
    compliance_checklist_id UUID REFERENCES compliance_checklists(id),
    compliance_status   VARCHAR(20) DEFAULT 'pending',
    
    -- Inspection
    inspection_required BOOLEAN DEFAULT TRUE,
    inspection_id       UUID,
    
    -- Payment
    payment_method      payment_method,
    escrow_id           VARCHAR(255),              -- External escrow reference
    
    -- Logistics
    freight_provider_id UUID,
    tracking_number     VARCHAR(100),
    shipment_status     VARCHAR(50),
    
    -- Documents
    contract_document_id UUID REFERENCES documents(id),
    
    -- Metrics
    total_value_usd     DECIMAL(18, 4),
    platform_fee_usd    DECIMAL(12, 2),
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    contract_signed_at  TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_deals_buyer ON deals(buyer_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_supplier ON deals(supplier_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_status ON deals(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_category ON deals(product_category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_created ON deals(created_at DESC) WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 12. DEAL MILESTONES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE deal_milestones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id             UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    
    milestone_type      milestone_type NOT NULL,
    sequence_order      INTEGER NOT NULL,
    
    -- Status
    status              milestone_status NOT NULL DEFAULT 'pending',
    scheduled_date      DATE,
    completed_at        TIMESTAMPTZ,
    completed_by        UUID REFERENCES users(id),
    
    -- Evidence
    evidence_document_id UUID REFERENCES documents(id),
    notes               TEXT,
    
    -- For payment milestones
    payment_percentage  DECIMAL(5, 2),             -- e.g. 30.00 for 30%
    payment_amount      DECIMAL(18, 4),
    payment_currency    currency_code,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_deal ON deal_milestones(deal_id);
CREATE INDEX idx_milestones_status ON deal_milestones(status);
CREATE INDEX idx_milestones_type ON deal_milestones(milestone_type);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 13. MESSAGES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    deal_id             UUID REFERENCES deals(id) ON DELETE CASCADE,
    rfq_id              UUID REFERENCES rfqs(id) ON DELETE CASCADE,
    
    -- Sender
    sender_org_id       UUID NOT NULL REFERENCES organizations(id),
    sender_user_id      UUID NOT NULL REFERENCES users(id),
    
    -- Content
    message_type        message_type NOT NULL DEFAULT 'text',
    content             TEXT NOT NULL,
    
    -- Translation
    original_language   VARCHAR(10) DEFAULT 'en',
    translated_content  JSONB,                     -- {"en": "...", "fr": "..."}
    
    -- File attachment
    attachment_document_id UUID REFERENCES documents(id),
    
    -- Status
    is_edited           BOOLEAN DEFAULT FALSE,
    edited_at           TIMESTAMPTZ,
    
    -- Read receipts
    read_by             JSONB DEFAULT '{}',        -- {"user_id": "timestamp", ...}
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

-- Create partitions (monthly, starting from current month)
CREATE TABLE messages_2026_07 PARTITION OF messages
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE messages_2026_08 PARTITION OF messages
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE messages_2026_09 PARTITION OF messages
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- Automated partition creation function
CREATE OR REPLACE FUNCTION create_message_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'messages_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := partition_date;
    end_date := partition_date + INTERVAL '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF messages FOR VALUES FROM (%L) TO (%L)',
                   partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

CREATE INDEX idx_messages_deal ON messages(deal_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_rfqs ON messages(rfq_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender ON messages(sender_org_id, created_at DESC) WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 14. INSPECTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE inspections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    deal_id             UUID REFERENCES deals(id),
    product_id          UUID REFERENCES products(id),
    organization_id     UUID NOT NULL REFERENCES organizations(id), -- inspected org
    
    -- Inspector
    inspector_org_id    UUID REFERENCES organizations(id),          -- inspection company
    inspector_user_id   UUID REFERENCES users(id),
    
    -- Details
    inspection_type     inspection_type NOT NULL,
    scheduled_date      DATE,
    completed_date      DATE,
    location            VARCHAR(255),
    
    -- Results
    result              inspection_result DEFAULT 'pending',
    findings            TEXT,
    corrective_actions  TEXT,
    
    -- Quantitative Results
    quantity_verified   DECIMAL(18, 4),
    quality_grade       VARCHAR(50),
    moisture_content    DECIMAL(5, 2),
    defect_count        INTEGER,
    contamination_found BOOLEAN DEFAULT FALSE,
    temperature_celsius DECIMAL(5, 2),
    
    -- Evidence
    photos              TEXT[],
    videos              TEXT[],
    report_document_id  UUID REFERENCES documents(id),
    
    -- Acceptance
    buyer_accepted      BOOLEAN,
    buyer_accepted_at   TIMESTAMPTZ,
    buyer_notes         TEXT,
    
    -- Cost
    cost_usd            DECIMAL(12, 2),
    paid_by             VARCHAR(50),             -- 'buyer', 'seller', 'split'
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_inspections_deal ON inspections(deal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_org ON inspections(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_inspector ON inspections(inspector_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_result ON inspections(result) WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 15. PAYMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    deal_id             UUID NOT NULL REFERENCES deals(id),
    milestone_id        UUID REFERENCES deal_milestones(id),
    
    -- Parties
    payer_org_id        UUID NOT NULL REFERENCES organizations(id),
    payee_org_id        UUID NOT NULL REFERENCES organizations(id),
    
    -- Amount
    amount              DECIMAL(18, 4) NOT NULL,
    currency            currency_code NOT NULL DEFAULT 'USD',
    amount_usd          DECIMAL(18, 4),          -- Converted at payment time
    exchange_rate       DECIMAL(18, 8),
    
    -- Payment Details
    payment_method      payment_method NOT NULL,
    status              payment_status NOT NULL DEFAULT 'pending',
    
    -- External Reference
    external_provider   VARCHAR(50),             -- 'stripe', 'flutterwave', 'dlocal', 'bank'
    external_reference  VARCHAR(255),
    external_metadata   JSONB,
    
    -- Milestone linkage
    release_condition   VARCHAR(255),            -- e.g. "inspection_passed"
    released_at         TIMESTAMPTZ,
    released_by         UUID REFERENCES users(id),
    
    -- Fees
    platform_fee_amount DECIMAL(12, 4),
    platform_fee_currency currency_code,
    provider_fee_amount DECIMAL(12, 4),
    provider_fee_currency currency_code,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_payments_deal ON payments(deal_id);
CREATE INDEX idx_payments_payer ON payments(payer_org_id);
CREATE INDEX idx_payments_payee ON payments(payee_org_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external ON payments(external_reference) WHERE external_reference IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 16. SERVICE PROVIDERS (Trade Services Directory)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE service_provider_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    
    -- Services Offered
    service_types       TEXT[] NOT NULL,           -- ['inspection', 'freight', 'lab_testing', 'certification']
    
    -- Coverage
    origin_countries    CHAR(2)[],
    destination_countries CHAR(2)[],
    corridors           JSONB,                     -- [{"origin": "KE", "destination": "NL"}, ...]
    
    -- Capabilities
    product_categories  UUID[],                    -- References product_categories
    specializations     TEXT[],
    
    -- Pricing
    pricing_model       VARCHAR(50),               -- 'per_shipment', 'per_kg', 'flat_fee', 'quote_based'
    pricing_details     JSONB,
    
    -- Performance
    completed_jobs      INTEGER DEFAULT 0,
    average_rating      DECIMAL(3, 2),
    response_time_hours DECIMAL(5, 2),
    
    -- Verification
    is_verified         BOOLEAN DEFAULT FALSE,
    verified_at         TIMESTAMPTZ,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_org ON service_provider_profiles(organization_id);
CREATE INDEX idx_sp_types ON service_provider_profiles USING GIN(service_types);
CREATE INDEX idx_sp_countries ON service_provider_profiles USING GIN(origin_countries);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 17. AUDIT LOG (Immutable, Partitioned)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE audit_logs (
    id                  BIGSERIAL,
    
    -- Who
    actor_user_id       UUID REFERENCES users(id),
    actor_org_id        UUID REFERENCES organizations(id),
    actor_ip            INET,
    actor_user_agent    TEXT,
    
    -- What
    action              audit_action NOT NULL,
    entity_type         VARCHAR(50) NOT NULL,      -- 'organization', 'product', 'deal', 'payment', etc.
    entity_id           UUID NOT NULL,
    
    -- Change Details
    previous_state      JSONB,
    new_state           JSONB,
    change_summary      TEXT,
    
    -- Context
    request_id          VARCHAR(100),
    session_id          VARCHAR(100),
    
    -- Timestamp (partition key)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Partitions (monthly)
CREATE TABLE audit_logs_2026_07 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_logs_2026_08 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 18. NOTIFICATIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    recipient_user_id   UUID NOT NULL REFERENCES users(id),
    recipient_org_id    UUID REFERENCES organizations(id),
    
    -- Content
    type                VARCHAR(50) NOT NULL,      -- 'rfq_match', 'quote_received', 'milestone_due', 'inspection_complete'
    title               VARCHAR(255) NOT NULL,
    body                TEXT,
    
    -- Action
    action_url          VARCHAR(500),
    action_type         VARCHAR(50),               -- 'navigate', 'modal', 'external'
    
    -- Related Entity
    entity_type         VARCHAR(50),
    entity_id           UUID,
    
    -- Delivery
    channels            TEXT[],                    -- ['in_app', 'email', 'push', 'sms', 'whatsapp']
    
    -- Status
    is_read             BOOLEAN DEFAULT FALSE,
    read_at             TIMESTAMPTZ,
    is_archived         BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    search_vector       TSVECTOR
);

CREATE INDEX idx_notifications_user ON notifications(recipient_user_id, created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(recipient_user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 19. RLS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (simplified - full policies in auth service)
-- Products: visible if published, or owned by user's org
CREATE POLICY products_read ON products FOR SELECT
    USING (
        deleted_at IS NULL AND (
            status = 'published'
            OR organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = current_setting('app.current_user_id')::UUID
                  AND deleted_at IS NULL
            )
        )
    );

-- Deals: visible to buyer or supplier org members
CREATE POLICY deals_read ON deals FOR SELECT
    USING (
        deleted_at IS NULL AND (
            buyer_org_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = current_setting('app.current_user_id')::UUID
                  AND deleted_at IS NULL
            )
            OR supplier_org_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = current_setting('app.current_user_id')::UUID
                  AND deleted_at IS NULL
            )
        )
    );

-- Messages: visible to deal participants
CREATE POLICY messages_read ON messages FOR SELECT
    USING (
        deleted_at IS NULL AND (
            sender_org_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = current_setting('app.current_user_id')::UUID
                  AND deleted_at IS NULL
            )
            OR deal_id IN (
                SELECT id FROM deals
                WHERE buyer_org_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE user_id = current_setting('app.current_user_id')::UUID
                      AND deleted_at IS NULL
                )
                OR supplier_org_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE user_id = current_setting('app.current_user_id')::UUID
                      AND deleted_at IS NULL
                )
            )
        )
    );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 20. FUNCTIONS & TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER org_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER user_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER org_member_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER doc_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER product_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER cat_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER comp_rule_updated_at BEFORE UPDATE ON compliance_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER checklist_updated_at BEFORE UPDATE ON compliance_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER checklist_item_updated_at BEFORE UPDATE ON compliance_checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER rfq_updated_at BEFORE UPDATE ON rfqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER quote_updated_at BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER deal_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER milestone_updated_at BEFORE UPDATE ON deal_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER inspection_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER payment_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Soft delete helper
CREATE OR REPLACE FUNCTION soft_delete(table_name TEXT, record_id UUID)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = %L', table_name, record_id);
    
    -- Write audit log
    INSERT INTO audit_logs (action, entity_type, entity_id, change_summary, created_at)
    VALUES ('deleted', table_name, record_id, 'Record soft deleted', NOW());
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 21. VIEWS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supplier Performance Dashboard
CREATE VIEW supplier_performance AS
SELECT 
    o.id AS organization_id,
    o.name,
    o.country_code,
    o.verification_level,
    COUNT(DISTINCT p.id) AS active_products,
    COUNT(DISTINCT d.id) AS total_deals,
    COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) AS completed_deals,
    COALESCE(AVG(CASE WHEN d.status = 'completed' THEN d.total_value_usd END), 0) AS avg_deal_value,
    COUNT(DISTINCT i.id) AS inspections_count,
    COUNT(DISTINCT CASE WHEN i.result = 'pass' THEN i.id END) AS inspections_passed,
    o.trust_score,
    o.risk_score
FROM organizations o
LEFT JOIN products p ON p.organization_id = o.id AND p.status = 'published' AND p.deleted_at IS NULL
LEFT JOIN deals d ON d.supplier_org_id = o.id AND d.deleted_at IS NULL
LEFT JOIN inspections i ON i.organization_id = o.id AND i.deleted_at IS NULL
WHERE o.type IN ('farmer', 'cooperative', 'processor', 'exporter', 'trader')
  AND o.deleted_at IS NULL
GROUP BY o.id, o.name, o.country_code, o.verification_level, o.trust_score, o.risk_score;

-- Active Deals with Party Names
CREATE VIEW active_deals AS
SELECT 
    d.*,
    buyer.name AS buyer_name,
    supplier.name AS supplier_name,
    cat.name AS category_name,
    COUNT(dm.id) AS total_milestones,
    COUNT(CASE WHEN dm.status = 'completed' THEN dm.id END) AS completed_milestones
FROM deals d
JOIN organizations buyer ON d.buyer_org_id = buyer.id
JOIN organizations supplier ON d.supplier_org_id = supplier.id
JOIN product_categories cat ON d.product_category_id = cat.id
LEFT JOIN deal_milestones dm ON dm.deal_id = d.id
WHERE d.deleted_at IS NULL
  AND d.status NOT IN ('completed', 'cancelled', 'disputed')
GROUP BY d.id, buyer.name, supplier.name, cat.name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DOCUMENTATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON TABLE organizations IS 'Canonical entity for all platform participants (suppliers, buyers, service providers, admins)';
COMMENT ON TABLE users IS 'Individual user accounts with authentication credentials';
COMMENT ON TABLE products IS 'Supplier product listings with category-specific flexible attributes via JSONB';
COMMENT ON TABLE compliance_rules IS 'Source-linked, versioned trade compliance requirements by corridor and category';
COMMENT ON TABLE deals IS 'Core transaction entity (Deal Room) tracking full commercial journey';
COMMENT ON TABLE audit_logs IS 'Immutable append-only record of all significant platform actions';
COMMENT ON TABLE messages IS 'Partitioned by month for scale; supports deal and RFQ context';
