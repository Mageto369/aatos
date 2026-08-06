import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Phase 3 Schema Update
 * 
 * Adds new Phase 3/4 entities, removes obsolete tables.
 * Generated: 2026-08-06
 * Base: InitialSchema1722720000000
 */
export class Phase3SchemaUpdate1722800000000 implements MigrationInterface {
  name = 'Phase3SchemaUpdate1722800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. COMPLIANCE RULES: Remove obsolete columns (entity simplified)
    // ============================================================
    await queryRunner.query(`
      ALTER TABLE compliance_rules 
      DROP COLUMN IF EXISTS issuing_authority_country,
      DROP COLUMN IF EXISTS required_document_type,
      DROP COLUMN IF EXISTS reviewed_by,
      DROP COLUMN IF EXISTS tags
    `);

    // ============================================================
    // 2. NEW TABLES: Phase 3/4 entities
    // ============================================================

    // Carbon Footprints
    await queryRunner.query(`
      CREATE TABLE carbon_footprints (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id VARCHAR(100) NOT NULL,
        deal_id VARCHAR(100),
        product_id VARCHAR(100),
        transport_mode VARCHAR(20) NOT NULL,
        origin VARCHAR(10) NOT NULL,
        destination VARCHAR(10) NOT NULL,
        distance_km DECIMAL(10, 2) NOT NULL,
        weight_kg DECIMAL(10, 2) NOT NULL,
        carbon_kg DECIMAL(10, 4) NOT NULL,
        calculation_method VARCHAR(100) NOT NULL,
        calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_carbon_org ON carbon_footprints(org_id)`);
    await queryRunner.query(`CREATE INDEX idx_carbon_deal ON carbon_footprints(deal_id)`);

    // Disputes
    await queryRunner.query(`
      CREATE TABLE disputes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deal_id VARCHAR(100) NOT NULL,
        initiator_id VARCHAR(100) NOT NULL,
        respondent_id VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        type VARCHAR(50) NOT NULL,
        claimed_amount DECIMAL(14, 2),
        currency VARCHAR(10),
        evidence JSONB,
        resolved_at TIMESTAMPTZ,
        resolution TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_dispute_deal ON disputes(deal_id)`);
    await queryRunner.query(`CREATE INDEX idx_dispute_status ON disputes(status)`);
    await queryRunner.query(`CREATE INDEX idx_dispute_initiator ON disputes(initiator_id)`);

    // Feature Flags
    await queryRunner.query(`
      CREATE TABLE feature_flags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT false,
        description VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        percentage INTEGER,
        allowed_users TEXT,
        allowed_orgs TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_feature_flag_key ON feature_flags(key)`);
    await queryRunner.query(`CREATE INDEX idx_feature_flag_enabled ON feature_flags(enabled)`);

    // Subscriptions
    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id VARCHAR(100) NOT NULL,
        tier_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'trialing',
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ,
        trial_ends_at TIMESTAMPTZ,
        auto_renew BOOLEAN NOT NULL DEFAULT true,
        billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_subscription_org ON subscriptions(org_id)`);
    await queryRunner.query(`CREATE INDEX idx_subscription_status ON subscriptions(status)`);

    // Webhooks
    await queryRunner.query(`
      CREATE TABLE webhooks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id VARCHAR(100) NOT NULL,
        url VARCHAR(500) NOT NULL,
        secret VARCHAR(255) NOT NULL,
        events TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_delivered_at TIMESTAMPTZ,
        delivery_attempts INTEGER NOT NULL DEFAULT 0,
        failed_attempts INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_webhook_org ON webhooks(org_id)`);
    await queryRunner.query(`CREATE INDEX idx_webhook_active ON webhooks(active)`);

    // ============================================================
    // 3. REMOVE OBSOLETE TABLES
    // ============================================================
    
    // service_provider_profiles — replaced by external partner integrations
    await queryRunner.query(`DROP TABLE IF EXISTS service_provider_profiles CASCADE`);
    
    // product_category_attributes — merged into product_categories JSONB
    await queryRunner.query(`DROP TABLE IF EXISTS product_category_attributes CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore obsolete tables (empty structure, data is lost)
    await queryRunner.query(`
      CREATE TABLE service_provider_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID REFERENCES organizations(id),
        service_types TEXT[] NOT NULL,
        origin_countries TEXT[] NOT NULL,
        destination_countries TEXT[] NOT NULL,
        certifications TEXT[],
        rating DECIMAL(2, 1),
        review_count INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sp_org ON service_provider_profiles(organization_id)`);
    await queryRunner.query(`CREATE INDEX idx_sp_types ON service_provider_profiles USING GIN(service_types)`);
    await queryRunner.query(`CREATE INDEX idx_sp_countries ON service_provider_profiles USING GIN(origin_countries)`);

    await queryRunner.query(`
      CREATE TABLE product_category_attributes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID REFERENCES product_categories(id),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        required BOOLEAN DEFAULT false,
        options TEXT[],
        unit VARCHAR(50),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_cat_attrs_category ON product_category_attributes(category_id)`);

    // Drop new tables
    await queryRunner.query(`DROP TABLE IF EXISTS webhooks CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS feature_flags CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS disputes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS carbon_footprints CASCADE`);

    // Restore compliance_rules columns
    await queryRunner.query(`
      ALTER TABLE compliance_rules 
      ADD COLUMN IF NOT EXISTS issuing_authority_country CHAR(2),
      ADD COLUMN IF NOT EXISTS required_document_type document_type,
      ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS tags TEXT[]
    `);
  }
}
