import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1722720000000 implements MigrationInterface {
  name = 'InitialSchema1722720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gin"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);

    // Enums
    await queryRunner.query(`
      CREATE TYPE org_type AS ENUM (
        'farmer', 'cooperative', 'aggregator', 'processor', 'manufacturer',
        'exporter', 'trader', 'importer', 'distributor', 'retailer',
        'hospitality', 'government', 'ngo', 'lab', 'inspector', 'certifier',
        'freight_forwarder', 'customs_broker', 'warehouse', 'insurer', 'bank',
        'trade_finance', 'consultant', 'platform_admin'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE org_status AS ENUM (
        'draft', 'pending_verification', 'verified', 'suspended', 'rejected', 'inactive'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE verification_level AS ENUM (
        'none', 'email_phone', 'business_registration', 'physical_site',
        'banking_verified', 'trade_references', 'fully_verified'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM (
        'owner', 'admin', 'operator', 'agent', 'viewer', 'compliance_officer',
        'finance_officer', 'logistics_officer', 'support'
      )
    `);
    await queryRunner.query(`CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'invited')`);
    await queryRunner.query(`
      CREATE TYPE document_type AS ENUM (
        'business_registration', 'export_license', 'import_license',
        'phytosanitary_certificate', 'certificate_of_origin', 'quality_certificate',
        'organic_certificate', 'fair_trade_certificate', 'bank_statement',
        'tax_certificate', 'identity_document', 'inspection_report',
        'lab_report', 'contract', 'invoice', 'bill_of_lading', 'insurance_policy',
        'customs_declaration', 'packing_list', 'other'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE document_status AS ENUM (
        'uploaded', 'pending_review', 'verified', 'rejected', 'expired', 'revoked'
      )
    `);
    await queryRunner.query(`CREATE TYPE product_status AS ENUM ('draft', 'pending_review', 'published', 'unpublished', 'archived')`);
    await queryRunner.query(`
      CREATE TYPE product_category_group AS ENUM (
        'beverage_crops', 'fresh_produce', 'dry_commodities', 'spices_botanicals',
        'animal_products', 'seafood', 'processed_products', 'other'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE rfq_status AS ENUM (
        'draft', 'published', 'matching', 'reviewing_quotes', 'negotiating',
        'awarded', 'expired', 'cancelled'
      )
    `);
    await queryRunner.query(`CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'under_review', 'accepted', 'rejected', 'expired')`);
    await queryRunner.query(`
      CREATE TYPE deal_status AS ENUM (
        'negotiating', 'contract_pending', 'contract_signed', 'inspection_scheduled',
        'inspection_passed', 'inspection_failed', 'payment_pending', 'payment_received',
        'shipment_booked', 'in_transit', 'customs_clearance', 'delivered',
        'completed', 'disputed', 'cancelled'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE milestone_type AS ENUM (
        'contract_signing', 'advance_payment', 'inspection_booking', 'inspection_completion',
        'shipment_booking', 'document_submission', 'main_payment', 'delivery_confirmation',
        'final_payment', 'dispute_resolution'
      )
    `);
    await queryRunner.query(`CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'overdue')`);
    await queryRunner.query(`
      CREATE TYPE payment_method AS ENUM (
        'bank_transfer', 'escrow', 'letter_of_credit', 'documentary_collection',
        'advance_payment', 'installment', 'trade_finance'
      )
    `);
    await queryRunner.query(`CREATE TYPE payment_status AS ENUM ('pending', 'held', 'released', 'refunded', 'failed', 'disputed')`);
    await queryRunner.query(`
      CREATE TYPE compliance_requirement_type AS ENUM (
        'document', 'inspection', 'laboratory_test', 'certification', 'registration',
        'label', 'permit', 'fee', 'tax'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE inspection_type AS ENUM (
        'farm', 'facility', 'warehouse', 'packing', 'port', 'pre_shipment', 'destination'
      )
    `);
    await queryRunner.query(`CREATE TYPE inspection_result AS ENUM ('pending', 'pass', 'fail', 'conditional', 'waiver')`);
    await queryRunner.query(`CREATE TYPE message_type AS ENUM ('text', 'file', 'quote', 'contract', 'system', 'translation')`);
    await queryRunner.query(`
      CREATE TYPE audit_action AS ENUM (
        'created', 'updated', 'deleted', 'verified', 'rejected', 'approved',
        'signed', 'paid', 'shipped', 'delivered', 'viewed', 'downloaded',
        'messaged', 'matched', 'escalated'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE currency_code AS ENUM (
        'USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KES', 'NGN', 'ETB', 'GHS', 'TZS',
        'ZAR', 'UGX', 'RWF', 'ZMW', 'XOF', 'XAF', 'AED', 'SAR', 'INR', 'BRL'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE unit_of_measure AS ENUM (
        'kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft',
        'liter', 'gallon', 'piece', 'dozen', 'pallet'
      )
    `);
    await queryRunner.query(`CREATE TYPE incoterm AS ENUM ('EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP')`);

    // Users table (before organizations due to FK)
    await queryRunner.query(`
      CREATE TABLE users (
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
        status user_status NOT NULL DEFAULT 'invited',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        search_vector TSVECTOR
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_users_search ON users USING GIN(search_vector)`);

    // Organizations table
    await queryRunner.query(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name CITEXT NOT NULL,
        legal_name CITEXT,
        slug CITEXT UNIQUE NOT NULL,
        type org_type NOT NULL,
        status org_status NOT NULL DEFAULT 'draft',
        verification_level verification_level NOT NULL DEFAULT 'none',
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
        capacity_unit unit_of_measure,
        processing_capacity BOOLEAN DEFAULT FALSE,
        storage_capacity BOOLEAN DEFAULT FALSE,
        cold_chain BOOLEAN DEFAULT FALSE,
        profile_completeness SMALLINT DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
        risk_score SMALLINT DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
        trust_score SMALLINT DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
        bank_name VARCHAR(200),
        bank_account_verified BOOLEAN DEFAULT FALSE,
        primary_contact_user_id UUID REFERENCES users(id),
        referral_code VARCHAR(50),
        referred_by_org_id UUID REFERENCES organizations(id),
        timezone VARCHAR(50) DEFAULT 'UTC',
        locale VARCHAR(10) DEFAULT 'en',
        currency_preference currency_code DEFAULT 'USD',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        search_vector TSVECTOR
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_org_country ON organizations(country_code) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_type ON organizations(type) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_status ON organizations(status) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_verification ON organizations(verification_level) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_risk_score ON organizations(risk_score) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_trust_score ON organizations(trust_score DESC) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_search ON organizations USING GIN(search_vector)`);
    await queryRunner.query(`CREATE INDEX idx_org_referred_by ON organizations(referred_by_org_id) WHERE deleted_at IS NULL`);

    // Organization members
    await queryRunner.query(`
      CREATE TABLE organization_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role user_role NOT NULL DEFAULT 'viewer',
        permissions JSONB DEFAULT '{}',
        is_primary_contact BOOLEAN DEFAULT FALSE,
        invited_by UUID REFERENCES users(id),
        invited_at TIMESTAMPTZ,
        joined_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        UNIQUE(organization_id, user_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_org_members_org ON organization_members(organization_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_members_user ON organization_members(user_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_org_members_role ON organization_members(role) WHERE deleted_at IS NULL`);

    // Documents
    await queryRunner.query(`
      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
        type document_type NOT NULL,
        status document_status NOT NULL DEFAULT 'uploaded',
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
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_docs_org ON documents(organization_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_docs_type ON documents(type) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_docs_status ON documents(status) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_docs_expiry ON documents(expiry_date) WHERE deleted_at IS NULL AND expiry_date IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_docs_related ON documents(related_entity_type, related_entity_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_docs_extracted ON documents USING GIN(extracted_data) WHERE deleted_at IS NULL`);

    // Product categories
    await queryRunner.query(`
      CREATE TABLE product_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_id UUID REFERENCES product_categories(id),
        group_type product_category_group NOT NULL,
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
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_cat_parent ON product_categories(parent_id)`);
    await queryRunner.query(`CREATE INDEX idx_cat_group ON product_categories(group_type)`);
    await queryRunner.query(`CREATE INDEX idx_cat_active ON product_categories(is_active) WHERE is_active = TRUE`);

    // Category attributes
    await queryRunner.query(`
      CREATE TABLE product_category_attributes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        key VARCHAR(100) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        is_required BOOLEAN DEFAULT FALSE,
        is_filterable BOOLEAN DEFAULT FALSE,
        is_searchable BOOLEAN DEFAULT FALSE,
        is_displayable BOOLEAN DEFAULT TRUE,
        options JSONB,
        min_value DECIMAL(18, 6),
        max_value DECIMAL(18, 6),
        unit VARCHAR(50),
        input_type VARCHAR(50) DEFAULT 'text',
        help_text TEXT,
        sort_order INTEGER DEFAULT 0,
        UNIQUE(category_id, key)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_cat_attrs_category ON product_category_attributes(category_id)`);

    // Products
    await queryRunner.query(`
      CREATE TABLE products (
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
        available_unit unit_of_measure NOT NULL,
        moq DECIMAL(18, 4),
        moq_unit unit_of_measure,
        recurring_capacity BOOLEAN DEFAULT FALSE,
        recurring_frequency VARCHAR(50),
        price_fob DECIMAL(18, 4),
        price_cif DECIMAL(18, 4),
        price_unit unit_of_measure,
        currency currency_code DEFAULT 'USD',
        price_valid_until DATE,
        packaging_type VARCHAR(100),
        packaging_weight DECIMAL(10, 4),
        packaging_unit unit_of_measure,
        incoterm incoterm DEFAULT 'FOB',
        quality_grade VARCHAR(50),
        certifications TEXT[],
        lab_report_id UUID REFERENCES documents(id),
        eligible_countries CHAR(2)[],
        restricted_countries CHAR(2)[],
        status product_status NOT NULL DEFAULT 'draft',
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
        deleted_at TIMESTAMPTZ,
        search_vector TSVECTOR
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_products_org ON products(organization_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_products_country ON products(origin_country) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_products_price ON products(price_fob) WHERE deleted_at IS NULL AND status = 'published'`);
    await queryRunner.query(`CREATE INDEX idx_products_compliance ON products(compliance_score DESC) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_products_featured ON products(is_featured) WHERE deleted_at IS NULL AND status = 'published'`);
    await queryRunner.query(`CREATE INDEX idx_products_attributes ON products USING GIN(attributes) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_products_search ON products USING GIN(search_vector)`);

    // Compliance rules
    await queryRunner.query(`
      CREATE TABLE compliance_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        origin_country CHAR(2) NOT NULL,
        destination_country CHAR(2) NOT NULL,
        product_category_id UUID REFERENCES product_categories(id),
        requirement_type compliance_requirement_type NOT NULL,
        requirement TEXT NOT NULL,
        description TEXT,
        responsible_party VARCHAR(50) NOT NULL,
        issuing_authority VARCHAR(255),
        issuing_authority_country CHAR(2),
        estimated_time_days INTEGER,
        estimated_cost_usd DECIMAL(12, 2),
        validity_period VARCHAR(50),
        verification_method VARCHAR(255),
        required_document_type document_type,
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
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_comp_rules_corridor ON compliance_rules(origin_country, destination_country)`);
    await queryRunner.query(`CREATE INDEX idx_comp_rules_category ON compliance_rules(product_category_id)`);
    await queryRunner.query(`CREATE INDEX idx_comp_rules_type ON compliance_rules(requirement_type)`);
    await queryRunner.query(`CREATE INDEX idx_comp_rules_status ON compliance_rules(rule_status) WHERE rule_status = 'active'`);

    // Compliance checklists
    await queryRunner.query(`
      CREATE TABLE compliance_checklists (
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
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_checklists_entity ON compliance_checklists(entity_type, entity_id)`);
    await queryRunner.query(`CREATE INDEX idx_checklists_corridor ON compliance_checklists(origin_country, destination_country)`);

    // Compliance checklist items
    await queryRunner.query(`
      CREATE TABLE compliance_checklist_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        checklist_id UUID NOT NULL REFERENCES compliance_checklists(id) ON DELETE CASCADE,
        rule_id UUID REFERENCES compliance_rules(id),
        requirement_type compliance_requirement_type NOT NULL,
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
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_checklist_items_checklist ON compliance_checklist_items(checklist_id)`);
    await queryRunner.query(`CREATE INDEX idx_checklist_items_status ON compliance_checklist_items(status)`);

    // RFQs
    await queryRunner.query(`
      CREATE TABLE rfqs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        buyer_org_id UUID NOT NULL REFERENCES organizations(id),
        created_by_user_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        product_category_id UUID NOT NULL REFERENCES product_categories(id),
        specifications JSONB NOT NULL DEFAULT '{}',
        required_quantity DECIMAL(18, 4) NOT NULL,
        required_unit unit_of_measure NOT NULL,
        frequency VARCHAR(50),
        destination_country CHAR(2) NOT NULL,
        destination_city VARCHAR(100),
        delivery_date_start DATE,
        delivery_date_end DATE,
        response_deadline TIMESTAMPTZ NOT NULL,
        target_price DECIMAL(18, 4),
        target_price_currency currency_code DEFAULT 'USD',
        preferred_incoterm incoterm,
        payment_terms VARCHAR(100),
        required_certifications TEXT[],
        status rfq_status NOT NULL DEFAULT 'draft',
        matched_supplier_count INTEGER DEFAULT 0,
        quote_received_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT FALSE,
        invited_supplier_ids UUID[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        search_vector TSVECTOR
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_org_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_rfqs_category ON rfqs(product_category_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_rfqs_status ON rfqs(status) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_rfqs_deadline ON rfqs(response_deadline) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_rfqs_destination ON rfqs(destination_country) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_rfqs_search ON rfqs USING GIN(search_vector)`);

    // Quotations
    await queryRunner.query(`
      CREATE TABLE quotations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rfq_id UUID NOT NULL REFERENCES rfqs(id),
        supplier_org_id UUID NOT NULL REFERENCES organizations(id),
        product_id UUID REFERENCES products(id),
        created_by_user_id UUID NOT NULL REFERENCES users(id),
        unit_price DECIMAL(18, 4) NOT NULL,
        price_currency currency_code DEFAULT 'USD',
        price_per_unit unit_of_measure NOT NULL,
        total_price DECIMAL(18, 4) NOT NULL,
        quantity_offered DECIMAL(18, 4) NOT NULL,
        quantity_unit unit_of_measure NOT NULL,
        incoterm incoterm NOT NULL,
        delivery_time_days INTEGER,
        payment_terms VARCHAR(255),
        validity_days INTEGER DEFAULT 30,
        valid_until DATE,
        quality_grade VARCHAR(50),
        packaging_details TEXT,
        specifications JSONB DEFAULT '{}',
        status quotation_status NOT NULL DEFAULT 'draft',
        buyer_notes TEXT,
        supplier_notes TEXT,
        counter_offer JSONB,
        negotiation_round INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_quotes_rfqs ON quotations(rfq_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_quotes_supplier ON quotations(supplier_org_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_quotes_status ON quotations(status) WHERE deleted_at IS NULL`);

    // Deals
    await queryRunner.query(`
      CREATE TABLE deals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        buyer_org_id UUID NOT NULL REFERENCES organizations(id),
        supplier_org_id UUID NOT NULL REFERENCES organizations(id),
        rfq_id UUID REFERENCES rfqs(id),
        winning_quotation_id UUID REFERENCES quotations(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        product_category_id UUID NOT NULL REFERENCES product_categories(id),
        agreed_quantity DECIMAL(18, 4) NOT NULL,
        quantity_unit unit_of_measure NOT NULL,
        agreed_price DECIMAL(18, 4) NOT NULL,
        price_currency currency_code DEFAULT 'USD',
        incoterm incoterm NOT NULL,
        payment_terms VARCHAR(255),
        delivery_date DATE,
        status deal_status NOT NULL DEFAULT 'negotiating',
        compliance_checklist_id UUID REFERENCES compliance_checklists(id),
        compliance_status VARCHAR(20) DEFAULT 'pending',
        inspection_required BOOLEAN DEFAULT TRUE,
        inspection_id UUID,
        payment_method payment_method,
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
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_deals_buyer ON deals(buyer_org_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_deals_supplier ON deals(supplier_org_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_deals_status ON deals(status) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_deals_category ON deals(product_category_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_deals_created ON deals(created_at DESC) WHERE deleted_at IS NULL`);

    // Deal milestones
    await queryRunner.query(`
      CREATE TABLE deal_milestones (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
        milestone_type milestone_type NOT NULL,
        sequence_order INTEGER NOT NULL,
        status milestone_status NOT NULL DEFAULT 'pending',
        scheduled_date DATE,
        completed_at TIMESTAMPTZ,
        completed_by UUID REFERENCES users(id),
        evidence_document_id UUID REFERENCES documents(id),
        notes TEXT,
        payment_percentage DECIMAL(5, 2),
        payment_amount DECIMAL(18, 4),
        payment_currency currency_code,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_milestones_deal ON deal_milestones(deal_id)`);
    await queryRunner.query(`CREATE INDEX idx_milestones_status ON deal_milestones(status)`);
    await queryRunner.query(`CREATE INDEX idx_milestones_type ON deal_milestones(milestone_type)`);

    // Messages (partitioned)
    await queryRunner.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
        rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
        sender_org_id UUID NOT NULL REFERENCES organizations(id),
        sender_user_id UUID NOT NULL REFERENCES users(id),
        message_type message_type NOT NULL DEFAULT 'text',
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
      ) PARTITION BY RANGE (created_at)
    `);
    await queryRunner.query(`CREATE TABLE messages_2026_07 PARTITION OF messages FOR VALUES FROM ('2026-07-01') TO ('2026-08-01')`);
    await queryRunner.query(`CREATE TABLE messages_2026_08 PARTITION OF messages FOR VALUES FROM ('2026-08-01') TO ('2026-09-01')`);
    await queryRunner.query(`CREATE TABLE messages_2026_09 PARTITION OF messages FOR VALUES FROM ('2026-09-01') TO ('2026-10-01')`);
    await queryRunner.query(`CREATE INDEX idx_messages_deal ON messages(deal_id, created_at DESC) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_messages_rfqs ON messages(rfq_id, created_at DESC) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_messages_sender ON messages(sender_org_id, created_at DESC) WHERE deleted_at IS NULL`);

    // Inspections
    await queryRunner.query(`
      CREATE TABLE inspections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deal_id UUID REFERENCES deals(id),
        product_id UUID REFERENCES products(id),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        inspector_org_id UUID REFERENCES organizations(id),
        inspector_user_id UUID REFERENCES users(id),
        inspection_type inspection_type NOT NULL,
        scheduled_date DATE,
        completed_date DATE,
        location VARCHAR(255),
        result inspection_result DEFAULT 'pending',
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
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_inspections_deal ON inspections(deal_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_inspections_org ON inspections(organization_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_inspections_inspector ON inspections(inspector_org_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_inspections_result ON inspections(result) WHERE deleted_at IS NULL`);

    // Payments
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deal_id UUID NOT NULL REFERENCES deals(id),
        milestone_id UUID REFERENCES deal_milestones(id),
        payer_org_id UUID NOT NULL REFERENCES organizations(id),
        payee_org_id UUID NOT NULL REFERENCES organizations(id),
        amount DECIMAL(18, 4) NOT NULL,
        currency currency_code NOT NULL DEFAULT 'USD',
        amount_usd DECIMAL(18, 4),
        exchange_rate DECIMAL(18, 8),
        payment_method payment_method NOT NULL,
        status payment_status NOT NULL DEFAULT 'pending',
        external_provider VARCHAR(50),
        external_reference VARCHAR(255),
        external_metadata JSONB,
        release_condition VARCHAR(255),
        released_at TIMESTAMPTZ,
        released_by UUID REFERENCES users(id),
        platform_fee_amount DECIMAL(12, 4),
        platform_fee_currency currency_code,
        provider_fee_amount DECIMAL(12, 4),
        provider_fee_currency currency_code,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_payments_deal ON payments(deal_id)`);
    await queryRunner.query(`CREATE INDEX idx_payments_payer ON payments(payer_org_id)`);
    await queryRunner.query(`CREATE INDEX idx_payments_payee ON payments(payee_org_id)`);
    await queryRunner.query(`CREATE INDEX idx_payments_status ON payments(status)`);
    await queryRunner.query(`CREATE INDEX idx_payments_external ON payments(external_reference) WHERE external_reference IS NOT NULL`);

    // Service provider profiles
    await queryRunner.query(`
      CREATE TABLE service_provider_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        service_types TEXT[] NOT NULL,
        origin_countries CHAR(2)[],
        destination_countries CHAR(2)[],
        corridors JSONB,
        product_categories UUID[],
        specializations TEXT[],
        pricing_model VARCHAR(50),
        pricing_details JSONB,
        completed_jobs INTEGER DEFAULT 0,
        average_rating DECIMAL(3, 2),
        response_time_hours DECIMAL(5, 2),
        is_verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sp_org ON service_provider_profiles(organization_id)`);
    await queryRunner.query(`CREATE INDEX idx_sp_types ON service_provider_profiles USING GIN(service_types)`);
    await queryRunner.query(`CREATE INDEX idx_sp_countries ON service_provider_profiles USING GIN(origin_countries)`);

    // Audit logs (partitioned)
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id BIGSERIAL,
        actor_user_id UUID REFERENCES users(id),
        actor_org_id UUID REFERENCES organizations(id),
        actor_ip INET,
        actor_user_agent TEXT,
        action audit_action NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        previous_state JSONB,
        new_state JSONB,
        change_summary TEXT,
        request_id VARCHAR(100),
        session_id VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      ) PARTITION BY RANGE (created_at)
    `);
    await queryRunner.query(`CREATE TABLE audit_logs_2026_07 PARTITION OF audit_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01')`);
    await queryRunner.query(`CREATE TABLE audit_logs_2026_08 PARTITION OF audit_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01')`);
    await queryRunner.query(`CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_audit_created ON audit_logs(created_at DESC)`);

    // Notifications
    await queryRunner.query(`
      CREATE TABLE notifications (
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        search_vector TSVECTOR
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_notifications_user ON notifications(recipient_user_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_notifications_read ON notifications(recipient_user_id, is_read) WHERE is_read = FALSE`);
    await queryRunner.query(`CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id)`);

    // Triggers
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    const tables = [
      'organizations', 'users', 'organization_members', 'documents',
      'product_categories', 'products', 'compliance_rules', 'compliance_checklists',
      'compliance_checklist_items', 'rfqs', 'quotations', 'deals', 'deal_milestones',
      'inspections', 'payments', 'service_provider_profiles', 'notifications'
    ];
    for (const table of tables) {
      await queryRunner.query(`CREATE TRIGGER ${table}_updated_at BEFORE UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    }

    // Search triggers
    await queryRunner.query(`
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
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`CREATE TRIGGER org_search_trigger BEFORE INSERT OR UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION org_search_update()`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION user_search_update()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`CREATE TRIGGER user_search_trigger BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION user_search_update()`);

    await queryRunner.query(`
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
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`CREATE TRIGGER product_search_trigger BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION product_search_update()`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION rfq_search_update()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`CREATE TRIGGER rfq_search_trigger BEFORE INSERT OR UPDATE ON rfqs FOR EACH ROW EXECUTE FUNCTION rfq_search_update()`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION product_publish_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status = 'published' AND OLD.status != 'published' THEN
          NEW.published_at := NOW();
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`CREATE TRIGGER product_publish_trigger BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION product_publish_timestamp()`);

    await queryRunner.query(`
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
      $$ LANGUAGE plpgsql
    `);

    // Views
    await queryRunner.query(`
      CREATE VIEW expiring_documents AS
      SELECT d.*, o.name as organization_name, o.primary_contact_user_id
      FROM documents d
      JOIN organizations o ON d.organization_id = o.id
      WHERE d.deleted_at IS NULL
        AND d.expiry_date IS NOT NULL
        AND d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND d.status IN ('verified', 'uploaded')
    `);

    await queryRunner.query(`
      CREATE VIEW supplier_performance AS
      SELECT
        o.id AS organization_id, o.name, o.country_code, o.verification_level,
        COUNT(DISTINCT p.id) AS active_products,
        COUNT(DISTINCT d.id) AS total_deals,
        COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) AS completed_deals,
        COALESCE(AVG(CASE WHEN d.status = 'completed' THEN d.total_value_usd END), 0) AS avg_deal_value,
        COUNT(DISTINCT i.id) AS inspections_count,
        COUNT(DISTINCT CASE WHEN i.result = 'pass' THEN i.id END) AS inspections_passed,
        o.trust_score, o.risk_score
      FROM organizations o
      LEFT JOIN products p ON p.organization_id = o.id AND p.status = 'published' AND p.deleted_at IS NULL
      LEFT JOIN deals d ON d.supplier_org_id = o.id AND d.deleted_at IS NULL
      LEFT JOIN inspections i ON i.organization_id = o.id AND i.deleted_at IS NULL
      WHERE o.type IN ('farmer', 'cooperative', 'processor', 'exporter', 'trader')
        AND o.deleted_at IS NULL
      GROUP BY o.id, o.name, o.country_code, o.verification_level, o.trust_score, o.risk_score
    `);

    await queryRunner.query(`
      CREATE VIEW active_deals AS
      SELECT d.*, buyer.name AS buyer_name, supplier.name AS supplier_name, cat.name AS category_name,
        COUNT(dm.id) AS total_milestones,
        COUNT(CASE WHEN dm.status = 'completed' THEN dm.id END) AS completed_milestones
      FROM deals d
      JOIN organizations buyer ON d.buyer_org_id = buyer.id
      JOIN organizations supplier ON d.supplier_org_id = supplier.id
      JOIN product_categories cat ON d.product_category_id = cat.id
      LEFT JOIN deal_milestones dm ON dm.deal_id = d.id
      WHERE d.deleted_at IS NULL AND d.status NOT IN ('completed', 'cancelled', 'disputed')
      GROUP BY d.id, buyer.name, supplier.name, cat.name
    `);

    // RLS
    await queryRunner.query(`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`CREATE POLICY org_isolation ON organizations FOR ALL USING (deleted_at IS NULL)`);

    await queryRunner.query(`ALTER TABLE products ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE documents ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE quotations ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE deals ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE messages ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE payments ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE inspections ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Views
    await queryRunner.query(`DROP VIEW IF EXISTS active_deals`);
    await queryRunner.query(`DROP VIEW IF EXISTS supplier_performance`);
    await queryRunner.query(`DROP VIEW IF EXISTS expiring_documents`);

    // Tables (in reverse dependency order)
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_provider_profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
    await queryRunner.query(`DROP TABLE IF EXISTS inspections`);
    await queryRunner.query(`DROP TABLE IF EXISTS messages CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS deal_milestones`);
    await queryRunner.query(`DROP TABLE IF EXISTS deals`);
    await queryRunner.query(`DROP TABLE IF EXISTS quotations`);
    await queryRunner.query(`DROP TABLE IF EXISTS rfqs`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance_checklist_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance_checklists`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance_rules`);
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_category_attributes`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS documents`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);

    // Enums
    await queryRunner.query(`DROP TYPE IF EXISTS incoterm`);
    await queryRunner.query(`DROP TYPE IF EXISTS unit_of_measure`);
    await queryRunner.query(`DROP TYPE IF EXISTS currency_code`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_action`);
    await queryRunner.query(`DROP TYPE IF EXISTS message_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS inspection_result`);
    await queryRunner.query(`DROP TYPE IF EXISTS inspection_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS compliance_requirement_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method`);
    await queryRunner.query(`DROP TYPE IF EXISTS milestone_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS milestone_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS deal_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS quotation_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS rfq_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS product_category_group`);
    await queryRunner.query(`DROP TYPE IF EXISTS product_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
    await queryRunner.query(`DROP TYPE IF EXISTS verification_level`);
    await queryRunner.query(`DROP TYPE IF EXISTS org_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS org_type`);
  }
}
