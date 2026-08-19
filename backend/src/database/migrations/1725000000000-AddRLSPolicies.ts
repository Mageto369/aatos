import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Row Level Security (RLS) Policies
 * 
 * Defense-in-depth: enforces org-level access control at the database layer.
 * Application must set 'app.current_org_id' before queries:
 *   SET LOCAL app.current_org_id = '<org-id>';
 * 
 * Tables with RLS:
 * - deals (buyer or supplier org)
 * - rfqs (buyer org)
 * - products (owner org)
 * - documents (owner org)
 * - inspections (booking or inspector org)
 * - messages (sender org — recipient access via application layer)
 * - notifications (recipient org)
 * - payments (payer or payee org)
 * - organizations (own record + admin)
 * - organization_members (member's org)
 */
export class AddRLSPolicies1725000000000 implements MigrationInterface {
  name = 'AddRLSPolicies1725000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper: get current org from session variable
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION current_app_org_id()
      RETURNS TEXT AS $$
      BEGIN
        RETURN NULLIF(current_setting('app.current_org_id', true), '');
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Helper: check if session is platform admin
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION is_platform_admin()
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN current_app_org_id() = 'platform_admin';
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // ---- DEALS ----
    await queryRunner.query(`ALTER TABLE deals ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY deals_org_isolation ON deals
        FOR ALL
        TO PUBLIC
        USING (
          buyer_org_id::text = current_app_org_id()
          OR supplier_org_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- RFQS ----
    await queryRunner.query(`ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY rfqs_org_isolation ON rfqs
        FOR ALL
        TO PUBLIC
        USING (
          buyer_org_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- PRODUCTS ----
    await queryRunner.query(`ALTER TABLE products ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY products_org_isolation ON products
        FOR ALL
        TO PUBLIC
        USING (
          organization_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- DOCUMENTS ----
    await queryRunner.query(`ALTER TABLE documents ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY documents_org_isolation ON documents
        FOR ALL
        TO PUBLIC
        USING (
          organization_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- INSPECTIONS ----
    await queryRunner.query(`ALTER TABLE inspections ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY inspections_org_isolation ON inspections
        FOR ALL
        TO PUBLIC
        USING (
          organization_id::text = current_app_org_id()
          OR inspector_org_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- MESSAGES ----
    // Messages use sender_org_id. Recipient access is via deal room membership,
    // which is checked at the application layer. RLS here is basic defense-in-depth.
    await queryRunner.query(`ALTER TABLE messages ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY messages_org_isolation ON messages
        FOR ALL
        TO PUBLIC
        USING (
          sender_org_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- NOTIFICATIONS ----
    await queryRunner.query(`ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY notifications_org_isolation ON notifications
        FOR ALL
        TO PUBLIC
        USING (
          recipient_org_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- PAYMENTS ----
    await queryRunner.query(`ALTER TABLE payments ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY payments_org_isolation ON payments
        FOR ALL
        TO PUBLIC
        USING (
          payer_org_id::text = current_app_org_id()
          OR payee_org_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- ORGANIZATIONS ----
    await queryRunner.query(`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY organizations_org_isolation ON organizations
        FOR ALL
        TO PUBLIC
        USING (
          id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- ORGANIZATION MEMBERS ----
    await queryRunner.query(`ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY org_members_org_isolation ON organization_members
        FOR ALL
        TO PUBLIC
        USING (
          organization_id::text = current_app_org_id()
          OR is_platform_admin()
        );
    `);

    // ---- USERS ----
    // Users are not org-scoped directly. Application layer handles access control.
    // RLS on users would be complex (self + org members). Skip for now.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'deals', 'rfqs', 'products', 'documents', 'inspections',
      'messages', 'notifications', 'payments', 'organizations', 'organization_members',
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_org_isolation ON ${table}`);
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
    }

    await queryRunner.query(`DROP FUNCTION IF EXISTS current_app_org_id()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS is_platform_admin()`);
  }
}
