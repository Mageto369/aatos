-- AATOS Supabase Migration
-- Initial schema for staging and production environments
-- Generated from schema/01_core_schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Note: Row-level security and partitioning are simplified for Supabase compatibility
-- Full RLS policies are managed via the application layer

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name CITEXT NOT NULL,
    legal_name CITEXT,
    slug CITEXT UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    verification_level VARCHAR(50) NOT NULL DEFAULT 'none',
    country_code CHAR(2) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    year_established SMALLINT,
    employee_count VARCHAR(20),
    website VARCHAR(255),
    description TEXT,
    annual_capacity DECIMAL(18, 4),
    capacity_unit VARCHAR(50),
    processing_capacity BOOLEAN DEFAULT FALSE,
    storage_capacity BOOLEAN DEFAULT FALSE,
    cold_chain BOOLEAN DEFAULT FALSE,
    profile_completeness SMALLINT DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
    risk_score SMALLINT DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
    trust_score SMALLINT DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
    bank_name VARCHAR(200),
    bank_account_verified BOOLEAN DEFAULT FALSE,
    primary_contact_user_id UUID,
    referral_code VARCHAR(50),
    referred_by_org_id UUID REFERENCES organizations(id),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    currency_preference VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_org_country ON organizations(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_type ON organizations(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_status ON organizations(status) WHERE deleted_at IS NULL;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    phone VARCHAR(30),
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMPTZ,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    avatar_url VARCHAR(500),
    password_hash VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    failed_login_count INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'invited',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- Link organizations to users
ALTER TABLE organizations ADD CONSTRAINT fk_org_primary_contact
    FOREIGN KEY (primary_contact_user_id) REFERENCES users(id) DEFERRABLE INITIALLY DEFERRED;

-- Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_user ON organization_members(user_id) WHERE deleted_at IS NULL;

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES product_categories(id),
    group_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    hs_code VARCHAR(20),
    attribute_schema JSONB NOT NULL DEFAULT '{}',
    default_compliance_rules JSONB DEFAULT '[]',
    icon_url VARCHAR(500),
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cat_parent ON product_categories(parent_id);
CREATE INDEX idx_cat_active ON product_categories(is_active) WHERE is_active = TRUE;

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES product_categories(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    attributes JSONB NOT NULL DEFAULT '{}',
    origin_country CHAR(2) NOT NULL,
    origin_region VARCHAR(100),
    harvest_year SMALLINT,
    harvest_date DATE,
    available_quantity DECIMAL(18, 4) NOT NULL,
    available_unit VARCHAR(50) NOT NULL,
    moq DECIMAL(18, 4),
    moq_unit VARCHAR(50),
    recurring_capacity BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(50),
    price_fob DECIMAL(18, 4),
    price_cif DECIMAL(18, 4),
    price_unit VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    price_valid_until DATE,
    packaging_type VARCHAR(100),
    packaging_weight DECIMAL(10, 4),
    packaging_unit VARCHAR(50),
    incoterm VARCHAR(10) DEFAULT 'FOB',
    quality_grade VARCHAR(50),
    certifications TEXT[],
    eligible_countries CHAR(2)[],
    restricted_countries CHAR(2)[],
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    warehouse_location VARCHAR(255),
    warehouse_country CHAR(2),
    primary_image_url VARCHAR(500),
    image_urls TEXT[],
    video_urls TEXT[],
    compliance_score SMALLINT DEFAULT 0 CHECK (compliance_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_products_org ON products(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE deleted_at IS NULL AND status = 'published';

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'aatos-documents',
    extracted_data JSONB,
    extraction_confidence DECIMAL(4,3),
    extracted_text TEXT,
    verified_by_user_id UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    issue_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),
    document_number VARCHAR(255),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_docs_org ON documents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_type ON documents(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_status ON documents(status) WHERE deleted_at IS NULL;

-- RFQs
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_org_id UUID NOT NULL REFERENCES organizations(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    product_category_id UUID NOT NULL REFERENCES product_categories(id),
    specifications JSONB NOT NULL DEFAULT '{}',
    required_quantity DECIMAL(18, 4) NOT NULL,
    required_unit VARCHAR(50) NOT NULL,
    frequency VARCHAR(50),
    destination_country CHAR(2) NOT NULL,
    destination_city VARCHAR(100),
    delivery_date_start DATE,
    delivery_date_end DATE,
    response_deadline TIMESTAMPTZ NOT NULL,
    target_price DECIMAL(18, 4),
    target_price_currency VARCHAR(10) DEFAULT 'USD',
    preferred_incoterm VARCHAR(10),
    payment_terms VARCHAR(100),
    required_certifications TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    matched_supplier_count INTEGER DEFAULT 0,
    quote_received_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    invited_supplier_ids UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfqs_status ON rfqs(status) WHERE deleted_at IS NULL;

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id),
    supplier_org_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID REFERENCES products(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    unit_price DECIMAL(18, 4) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'USD',
    price_per_unit VARCHAR(50) NOT NULL,
    total_price DECIMAL(18, 4) NOT NULL,
    quantity_offered DECIMAL(18, 4) NOT NULL,
    quantity_unit VARCHAR(50) NOT NULL,
    incoterm VARCHAR(10) NOT NULL,
    delivery_time_days INTEGER,
    payment_terms VARCHAR(255),
    validity_days INTEGER DEFAULT 30,
    valid_until DATE,
    quality_grade VARCHAR(50),
    packaging_details TEXT,
    specifications JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    buyer_notes TEXT,
    supplier_notes TEXT,
    counter_offer JSONB,
    negotiation_round INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_quotes_rfqs ON quotations(rfq_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_supplier ON quotations(supplier_org_id) WHERE deleted_at IS NULL;

-- Deals
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_org_id UUID NOT NULL REFERENCES organizations(id),
    rfq_id UUID REFERENCES rfqs(id),
    winning_quotation_id UUID REFERENCES quotations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    product_category_id UUID NOT NULL REFERENCES product_categories(id),
    agreed_quantity DECIMAL(18, 4) NOT NULL,
    quantity_unit VARCHAR(50) NOT NULL,
    agreed_price DECIMAL(18, 4) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'USD',
    incoterm VARCHAR(10) NOT NULL,
    payment_terms VARCHAR(255),
    delivery_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'negotiating',
    compliance_checklist_id UUID,
    compliance_status VARCHAR(20) DEFAULT 'pending',
    inspection_required BOOLEAN DEFAULT TRUE,
    inspection_id UUID,
    payment_method VARCHAR(50),
    escrow_id VARCHAR(255),
    freight_provider_id UUID,
    tracking_number VARCHAR(100),
    shipment_status VARCHAR(50),
    contract_document_id UUID REFERENCES documents(id),
    total_value_usd DECIMAL(18, 4),
    platform_fee_usd DECIMAL(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    contract_signed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_buyer ON deals(buyer_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_supplier ON deals(supplier_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_status ON deals(status) WHERE deleted_at IS NULL;

-- Deal Milestones
CREATE TABLE IF NOT EXISTS deal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL,
    sequence_order INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    scheduled_date DATE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    evidence_document_id UUID REFERENCES documents(id),
    notes TEXT,
    payment_percentage DECIMAL(5, 2),
    payment_amount DECIMAL(18, 4),
    payment_currency VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_deal ON deal_milestones(deal_id);
CREATE INDEX idx_milestones_status ON deal_milestones(status);

-- Messages (simplified - no partitioning for Supabase)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
    sender_org_id UUID NOT NULL REFERENCES organizations(id),
    sender_user_id UUID NOT NULL REFERENCES users(id),
    message_type VARCHAR(50) NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    original_language VARCHAR(10) DEFAULT 'en',
    translated_content JSONB,
    attachment_document_id UUID REFERENCES documents(id),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    read_by JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_deal ON messages(deal_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender ON messages(sender_org_id, created_at DESC) WHERE deleted_at IS NULL;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL REFERENCES users(id),
    recipient_org_id UUID REFERENCES organizations(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    action_url VARCHAR(500),
    action_type VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id UUID,
    channels TEXT[],
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(recipient_user_id, created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(recipient_user_id, is_read) WHERE is_read = FALSE;

-- Inspections
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id),
    product_id UUID REFERENCES products(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    inspector_org_id UUID REFERENCES organizations(id),
    inspector_user_id UUID REFERENCES users(id),
    inspection_type VARCHAR(50) NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    location VARCHAR(255),
    result VARCHAR(50) DEFAULT 'pending',
    findings TEXT,
    corrective_actions TEXT,
    quantity_verified DECIMAL(18, 4),
    quality_grade VARCHAR(50),
    moisture_content DECIMAL(5, 2),
    defect_count INTEGER,
    contamination_found BOOLEAN DEFAULT FALSE,
    temperature_celsius DECIMAL(5, 2),
    photos TEXT[],
    videos TEXT[],
    report_document_id UUID REFERENCES documents(id),
    buyer_accepted BOOLEAN,
    buyer_accepted_at TIMESTAMPTZ,
    buyer_notes TEXT,
    cost_usd DECIMAL(12, 2),
    paid_by VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_inspections_deal ON inspections(deal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_org ON inspections(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_result ON inspections(result) WHERE deleted_at IS NULL;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id),
    milestone_id UUID REFERENCES deal_milestones(id),
    payer_org_id UUID NOT NULL REFERENCES organizations(id),
    payee_org_id UUID NOT NULL REFERENCES organizations(id),
    amount DECIMAL(18, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    amount_usd DECIMAL(18, 4),
    exchange_rate DECIMAL(18, 8),
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    external_provider VARCHAR(50),
    external_reference VARCHAR(255),
    external_metadata JSONB,
    release_condition VARCHAR(255),
    released_at TIMESTAMPTZ,
    released_by UUID REFERENCES users(id),
    platform_fee_amount DECIMAL(12, 4),
    platform_fee_currency VARCHAR(10),
    provider_fee_amount DECIMAL(12, 4),
    provider_fee_currency VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_deal ON payments(deal_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Compliance Rules
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_country CHAR(2) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    product_category_id UUID REFERENCES product_categories(id),
    requirement_type VARCHAR(50) NOT NULL,
    requirement TEXT NOT NULL,
    description TEXT,
    responsible_party VARCHAR(50) NOT NULL,
    issuing_authority VARCHAR(255),
    issuing_authority_country CHAR(2),
    estimated_time_days INTEGER,
    estimated_cost_usd DECIMAL(12, 2),
    validity_period VARCHAR(50),
    verification_method VARCHAR(255),
    required_document_type VARCHAR(50),
    source_url VARCHAR(500),
    source_name VARCHAR(255),
    reviewed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    reviewed_by UUID REFERENCES users(id),
    rule_status VARCHAR(20) DEFAULT 'active',
    rule_version INTEGER NOT NULL DEFAULT 1,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(origin_country, destination_country, product_category_id, requirement_type, requirement, rule_version)
);

CREATE INDEX idx_comp_rules_corridor ON compliance_rules(origin_country, destination_country);
CREATE INDEX idx_comp_rules_status ON compliance_rules(rule_status) WHERE rule_status = 'active';

-- Compliance Checklists
CREATE TABLE IF NOT EXISTS compliance_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    origin_country CHAR(2) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by_rules UUID[],
    overall_status VARCHAR(20) DEFAULT 'pending',
    completion_percent SMALLINT DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklists_entity ON compliance_checklists(entity_type, entity_id);

-- Compliance Checklist Items
CREATE TABLE IF NOT EXISTS compliance_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES compliance_checklists(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES compliance_rules(id),
    requirement_type VARCHAR(50) NOT NULL,
    requirement TEXT NOT NULL,
    description TEXT,
    responsible_party VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    document_id UUID REFERENCES documents(id),
    evidence_notes TEXT,
    completed_by UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    actual_cost_usd DECIMAL(12, 2),
    actual_time_days INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_checklist ON compliance_checklist_items(checklist_id);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id UUID REFERENCES users(id),
    actor_org_id UUID REFERENCES organizations(id),
    actor_ip INET,
    actor_user_agent TEXT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    change_summary TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at DESC);

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER org_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER user_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER org_member_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER doc_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER product_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER rfq_updated_at BEFORE UPDATE ON rfqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER quote_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER deal_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER milestone_updated_at BEFORE UPDATE ON deal_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER inspection_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER payment_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER message_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
