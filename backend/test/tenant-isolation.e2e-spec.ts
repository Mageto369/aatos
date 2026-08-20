import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { satisfyMfaEnrolment } from './mfa-fixture';

/**
 * Tenant isolation.
 *
 * Every one of these assertions corresponds to a hole that reached main:
 *
 *  - inspections.service.ts took an orgId its where clause never used
 *    (`where: { id,  }`), so any authenticated user could read, re-status or
 *    soft-delete any inspection by id.
 *  - products.controller.ts derived the acting organization from the
 *    client-supplied `x-organization-id` header, so the ownership check in
 *    products.service could be satisfied by naming the victim's org.
 *
 * Both passed the unit suite, which never crosses an organization boundary.
 * These tests exist so neither can return quietly.
 *
 * The suite runs three unrelated tenants:
 *
 *   A — the outsider. Never a party to anything B or C own.
 *   B — the victim. Buyer on the seeded RFQ and deal, owner of the seeded
 *       document, inspection, product and notification.
 *   C — B's counterparty. Supplier on the seeded quotation and deal, so the
 *       tests can tell "denied because the caller is a stranger" apart from
 *       "denied because the route is broken for everyone".
 *
 * Registration is rate limited (5 per 15 min, in memory, per app instance), so
 * the three tenants are created once in beforeAll and shared by every block.
 *
 * The four holes this suite originally recorded as `it.failing` — cross-tenant
 * deal creation, draft-RFQ disclosure, competitor price disclosure, and
 * cross-tenant quote acceptance — have since been fixed, and their
 * assertions now run as ordinary guards.
 *
 * What each of them was, before the fix in ef48026:
 *
 *   - GET  /rfqs/:id                      read any RFQ, unpublished drafts too
 *   - GET  /rfqs/:id/quotes               read competitors' prices on a tender
 *   - POST /rfqs/:id/quotes/:qid/accept   award anyone's RFQ, minting a deal
 *                                         between two unrelated companies
 *   - POST /deals                         buyerOrgId/supplierOrgId were hearsay
 *
 * A fifth, POST /workflows/quote/:id/accept, reached the same award path with
 * no organization check at all. It was found by grepping for other callers
 * rather than by a test, which is worth remembering: this suite covers routes
 * it knows about.
 */
describe('Tenant isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Three unrelated tenants.
  let tokenA: string;
  let orgA: string;
  let tokenB: string;
  let orgB: string;
  let userB: string;
  let tokenC: string;
  let orgC: string;
  let userC: string;

  let categoryId: string;

  let inspectionOfB: string;
  let productOfB: string;
  let rfqOfB: string;
  let draftRfqOfB: string;
  let quoteOfCOnBsRfq: string;
  let dealOfBC: string;
  let milestoneOfBC: string;
  let documentOfB: string;
  let notificationOfB: string;

  /** Title A tries to write onto a deal between B and C; unique per run. */
  let forgedDealTitle: string;

  const password = 'SecurePass123!';

  /** Unique-enough suffix; the test database is never reset between runs. */
  const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  async function createTenant(label: string) {
    const email = `${label}-${uniq()}@aatos.trade`;
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, firstName: label, lastName: 'Tenant' })
      .expect(201);
    const token = reg.body.data.accessToken;
    const userId = reg.body.data.user.id as string;

    const org = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `${label} Org ${uniq()}`,
        type: 'cooperative',
        countryCode: 'KE',
      })
      .expect(201);

    return { token, userId, orgId: org.body.data.id as string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = app.get(DataSource);

    let userA: string;
    ({ token: tokenA, orgId: orgA, userId: userA } = await createTenant('alpha'));
    ({ token: tokenB, orgId: orgB, userId: userB } = await createTenant('bravo'));
    ({ token: tokenC, orgId: orgC, userId: userC } = await createTenant('charlie'));

    // Owners are blocked by MfaEnrolmentGuard until they enrol; see the fixture.
    await satisfyMfaEnrolment(dataSource, [userA, userB, userC]);

    // An inspection belonging to B. Seeded directly: creating one through the
    // API needs a deal, and the boundary under test is the read/write path,
    // not the creation path. deal_id is nullable, so org + type suffice.
    const [inspection] = await dataSource.query(
      `INSERT INTO inspections (organization_id, inspection_type)
       VALUES ($1, 'pre_shipment') RETURNING id`,
      [orgB],
    );
    inspectionOfB = inspection.id;

    // A product belonging to B, created through the API as B would.
    const suffix = uniq();
    const [category] = await dataSource.query(
      `INSERT INTO product_categories (group_type, name, slug, code)
       VALUES ('beverage_crops', $1, $2, $3) RETURNING id`,
      [`Isolation Coffee ${suffix}`, `isolation-coffee-${suffix}`, `IC${Date.now()}`],
    );
    categoryId = category.id;

    const product = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Bravo Lot',
        categoryId,
        attributes: { grade: 'AA' },
        originCountry: 'KE',
        availableQuantity: 500,
        availableUnit: 'kg',
      })
      .expect(201);
    productOfB = product.body.data.id;

    // A published RFQ and an unpublished draft, both belonging to B.
    const [publishedRfq] = await dataSource.query(
      `INSERT INTO rfqs (buyer_org_id, created_by_user_id, title, product_category_id,
                         required_quantity, required_unit, destination_country,
                         response_deadline, status, published_at, is_public)
       VALUES ($1, $2, 'Bravo Published RFQ', $3, 1000, 'kg', 'DE',
               NOW() + INTERVAL '30 days', 'published', NOW(), true)
       RETURNING id`,
      [orgB, userB, categoryId],
    );
    rfqOfB = publishedRfq.id;

    const [draftRfq] = await dataSource.query(
      `INSERT INTO rfqs (buyer_org_id, created_by_user_id, title, product_category_id,
                         required_quantity, required_unit, destination_country,
                         response_deadline, status, is_public)
       VALUES ($1, $2, 'Bravo Secret Draft RFQ', $3, 250, 'kg', 'DE',
               NOW() + INTERVAL '30 days', 'draft', false)
       RETURNING id`,
      [orgB, userB, categoryId],
    );
    draftRfqOfB = draftRfq.id;

    // C's quotation against B's RFQ. Its unit price is the commercially
    // sensitive value A must not be able to reach.
    const [quote] = await dataSource.query(
      `INSERT INTO quotations (rfq_id, supplier_org_id, created_by_user_id, unit_price,
                               price_per_unit, total_price, quantity_offered,
                               quantity_unit, incoterm, status, sent_at)
       VALUES ($1, $2, $3, 5.5, 'kg', 5500, 1000, 'kg', 'FOB', 'sent', NOW())
       RETURNING id`,
      [rfqOfB, orgC, userC],
    );
    quoteOfCOnBsRfq = quote.id;

    // A deal between B (buyer) and C (supplier). A is a party to neither side.
    const [deal] = await dataSource.query(
      `INSERT INTO deals (buyer_org_id, supplier_org_id, title, product_category_id,
                          agreed_quantity, quantity_unit, agreed_price, incoterm, status)
       VALUES ($1, $2, 'Bravo-Charlie Deal', $3, 1000, 'kg', 5.5, 'FOB', 'negotiating')
       RETURNING id`,
      [orgB, orgC, categoryId],
    );
    dealOfBC = deal.id;

    const [milestone] = await dataSource.query(
      `INSERT INTO deal_milestones (deal_id, milestone_type, sequence_order, status)
       VALUES ($1, 'contract_signing', 1, 'pending') RETURNING id`,
      [dealOfBC],
    );
    milestoneOfBC = milestone.id;

    // A document belonging to B. Seeded directly: the create DTO does not name
    // the storage columns the table requires, and the boundary under test is
    // the read/write path.
    const [document] = await dataSource.query(
      `INSERT INTO documents (organization_id, uploaded_by_user_id, type, status, title,
                              file_name, file_size_bytes, mime_type, storage_key)
       VALUES ($1, $2, 'contract', 'uploaded', 'Bravo Export Contract',
               'bravo-contract.pdf', 2048, 'application/pdf', $3)
       RETURNING id`,
      [orgB, userB, `isolation/${suffix}/bravo-contract.pdf`],
    );
    documentOfB = document.id;

    // A notification addressed to B's owner.
    const [notification] = await dataSource.query(
      `INSERT INTO notifications (recipient_user_id, recipient_org_id, type, title, body)
       VALUES ($1, $2, 'deal_update', 'Bravo Only Notification',
               'Bravo-confidential notification body')
       RETURNING id`,
      [userB, orgB],
    );
    notificationOfB = notification.id;

    forgedDealTitle = `Forged By Alpha ${suffix}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets up three distinct organizations', () => {
    expect(orgA).toBeTruthy();
    expect(orgB).toBeTruthy();
    expect(orgC).toBeTruthy();
    expect(new Set([orgA, orgB, orgC]).size).toBe(3);
  });

  describe('inspections', () => {
    it("B can read B's own inspection", () => {
      return request(app.getHttpServer())
        .get(`/inspections/${inspectionOfB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
    });

    it("A cannot read B's inspection", () => {
      return request(app.getHttpServer())
        .get(`/inspections/${inspectionOfB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it("A cannot change the status of B's inspection", () => {
      return request(app.getHttpServer())
        .patch(`/inspections/${inspectionOfB}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'pass' })
        .expect(404);
    });

    it("A cannot delete B's inspection", () => {
      return request(app.getHttpServer())
        .delete(`/inspections/${inspectionOfB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it("B's inspection survives A's attempts", async () => {
      const res = await request(app.getHttpServer())
        .get(`/inspections/${inspectionOfB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.result).toBe('pending');
      expect(res.body.data.deletedAt ?? null).toBeNull();
    });
  });

  describe('products', () => {
    it("A cannot update B's product", () => {
      return request(app.getHttpServer())
        .patch(`/products/${productOfB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Seized by Alpha' })
        .expect(403);
    });

    it("A cannot update B's product by spoofing x-organization-id", () => {
      return request(app.getHttpServer())
        .patch(`/products/${productOfB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-organization-id', orgB)
        .send({ title: 'Seized by Alpha' })
        .expect(403);
    });

    it("A cannot delete B's product", () => {
      return request(app.getHttpServer())
        .delete(`/products/${productOfB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it("B's product is unchanged", async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/${productOfB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.title).toBe('Bravo Lot');
    });
  });

  describe('deals', () => {
    it('both parties to the deal can read it', async () => {
      const asBuyer = await request(app.getHttpServer())
        .get(`/deals/${dealOfBC}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(asBuyer.body.data.id).toBe(dealOfBC);

      const asSupplier = await request(app.getHttpServer())
        .get(`/deals/${dealOfBC}`)
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);
      expect(asSupplier.body.data.id).toBe(dealOfBC);
    });

    it("A cannot read B and C's deal", async () => {
      const res = await request(app.getHttpServer())
        .get(`/deals/${dealOfBC}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
      expect(JSON.stringify(res.body)).not.toContain('Bravo-Charlie Deal');
    });

    it("A's deal list does not leak B and C's deal", async () => {
      const res = await request(app.getHttpServer())
        .get('/deals')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const ids = (res.body.data.items ?? []).map((d: { id: string }) => d.id);
      expect(ids).not.toContain(dealOfBC);
    });

    it("B's deal list does contain B's deal", async () => {
      const res = await request(app.getHttpServer())
        .get('/deals')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      const ids = (res.body.data.items ?? []).map((d: { id: string }) => d.id);
      expect(ids).toContain(dealOfBC);
    });

    it("A cannot advance a milestone on B and C's deal", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/deals/${dealOfBC}/milestones/${milestoneOfBC}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'completed', notes: 'Forced by Alpha' });
      expect([403, 404]).toContain(res.status);
    });

    it("the milestone is untouched by A's attempt", async () => {
      const [row] = await dataSource.query(
        'SELECT status, notes, completed_at FROM deal_milestones WHERE id = $1',
        [milestoneOfBC],
      );
      expect(row.status).toBe('pending');
      expect(row.notes).toBeNull();
      expect(row.completed_at).toBeNull();
    });

    it('a party to the deal can advance the same milestone', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/deals/${dealOfBC}/milestones/${milestoneOfBC}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ status: 'in_progress', notes: 'Bravo signing' })
        .expect(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    /**
     * KNOWN HOLE — NOT FIXED. `DealsController.create` checks only that the
     * caller has *some* organization, then hands the DTO straight to
     * `DealsService.create`. `buyerOrgId` and `supplierOrgId` are client
     * supplied and never compared against `req.user.orgId`, so A can write a
     * binding deal — with milestones and a platform fee — between B and C.
     */
    it('A cannot create a deal between B and C', async () => {
      const res = await request(app.getHttpServer())
        .post('/deals')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          buyerOrgId: orgB,
          supplierOrgId: orgC,
          title: forgedDealTitle,
          productCategoryId: categoryId,
          agreedQuantity: 10,
          quantityUnit: 'mt',
          agreedPrice: 5.1,
          priceCurrency: 'USD',
          incoterm: 'CIF',
          originCountry: 'KE',
          destinationCountry: 'US',
        });
      expect([403, 404]).toContain(res.status);

      const [forged] = await dataSource.query(
        'SELECT COUNT(*)::int AS n FROM deals WHERE title = $1',
        [forgedDealTitle],
      );
      expect(forged.n).toBe(0);
    });
  });

  describe('rfqs', () => {
    it("B can read B's own RFQ", async () => {
      const res = await request(app.getHttpServer())
        .get(`/rfqs/${rfqOfB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.id).toBe(rfqOfB);
    });

    it("A's RFQ list does not leak B's RFQs", async () => {
      const res = await request(app.getHttpServer())
        .get('/rfqs')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const ids = (res.body.data.items ?? []).map((r: { id: string }) => r.id);
      expect(ids).not.toContain(rfqOfB);
      expect(ids).not.toContain(draftRfqOfB);
    });

    it("B's RFQ list contains B's own RFQs", async () => {
      const res = await request(app.getHttpServer())
        .get('/rfqs')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      const ids = (res.body.data.items ?? []).map((r: { id: string }) => r.id);
      expect(ids).toContain(rfqOfB);
      expect(ids).toContain(draftRfqOfB);
    });


    /**
     * KNOWN HOLE — NOT FIXED. `RfqsService.findOne` reads
     * `where: { id,  }` — the same vestigial trailing comma that cost us
     * inspections — and `RfqsController.findOne` takes no `req` at all, so it
     * has nothing to compare against. Any authenticated tenant can read any
     * RFQ by id, including a draft that has never been published and has
     * `is_public = false`.
     *
     * Marked `it.failing` so the correct expectation stays on the record
     * without the suite going red for a defect it only reports. When someone
     * scopes the read, this line turns red and the marker came off (fixed).
     */
    it("A cannot read B's unpublished, non-public draft RFQ", async () => {
      const res = await request(app.getHttpServer())
        .get(`/rfqs/${draftRfqOfB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
      expect(JSON.stringify(res.body)).not.toContain('Bravo Secret Draft RFQ');
    });

    it("A cannot publish B's draft RFQ", async () => {
      const res = await request(app.getHttpServer())
        .post(`/rfqs/${draftRfqOfB}/publish`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});
      expect([403, 404]).toContain(res.status);
    });

    it("B's draft RFQ is still a draft", async () => {
      const [row] = await dataSource.query(
        'SELECT status, published_at FROM rfqs WHERE id = $1',
        [draftRfqOfB],
      );
      expect(row.status).toBe('draft');
      expect(row.published_at).toBeNull();
    });

    it("B can publish B's own draft RFQ", async () => {
      const res = await request(app.getHttpServer())
        .post(`/rfqs/${draftRfqOfB}/publish`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({})
        .expect(201);
      expect(res.body.data.status).toBe('published');
    });
  });

  describe('quotations', () => {
    it("C can see C's own quotation on B's RFQ", async () => {
      const res = await request(app.getHttpServer())
        .get(`/rfqs/${rfqOfB}/quotes`)
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);
      const ids = (res.body.data ?? []).map((q: { id: string }) => q.id);
      expect(ids).toContain(quoteOfCOnBsRfq);
    });

    it("B, the RFQ's buyer, can see the quotations on it", async () => {
      const res = await request(app.getHttpServer())
        .get(`/rfqs/${rfqOfB}/quotes`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      const ids = (res.body.data ?? []).map((q: { id: string }) => q.id);
      expect(ids).toContain(quoteOfCOnBsRfq);
    });

    /**
     * KNOWN HOLE — NOT FIXED. `RfqsService.getQuotations` reads
     * `where: { rfqId,  }` and `RfqsController.getQuotations` takes no `req`.
     * Any authenticated tenant can read every quotation on any RFQ. What
     * leaks is a competitor's unit price on a live tender — the single most
     * sensitive number in the system.
     */
    it("A cannot read C's quoted price on B's RFQ", async () => {
      const res = await request(app.getHttpServer())
        .get(`/rfqs/${rfqOfB}/quotes`)
        .set('Authorization', `Bearer ${tokenA}`);

      if (res.status === 200) {
        const ids = (res.body.data ?? []).map((q: { id: string }) => q.id);
        expect(ids).not.toContain(quoteOfCOnBsRfq);
      } else {
        expect([403, 404]).toContain(res.status);
      }
    });

    /**
     * KNOWN HOLE — NOT FIXED, and the worst of them: it is a write.
     * `RfqsController.acceptQuote` checks only that the caller has *some*
     * organization, then calls `WorkflowService.onQuoteAccepted(quoteId)`,
     * which takes no acting organization at all. Any authenticated tenant can
     * accept any quotation on any RFQ — awarding the RFQ, flipping the
     * quotation to `accepted` and minting a deal between two organizations it
     * has nothing to do with.
     */
    it("A cannot accept C's quotation on B's RFQ", async () => {
      const res = await request(app.getHttpServer())
        .post(`/rfqs/${rfqOfB}/quotes/${quoteOfCOnBsRfq}/accept`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});
      expect([403, 404]).toContain(res.status);

      const [quote] = await dataSource.query(
        'SELECT status FROM quotations WHERE id = $1',
        [quoteOfCOnBsRfq],
      );
      expect(quote.status).toBe('sent');

      const [minted] = await dataSource.query(
        'SELECT COUNT(*)::int AS n FROM deals WHERE winning_quotation_id = $1',
        [quoteOfCOnBsRfq],
      );
      expect(minted.n).toBe(0);
    });
  });

  describe('documents', () => {
    it("B can read B's own document", async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${documentOfB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.title).toBe('Bravo Export Contract');
    });

    it("A cannot read B's document", async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${documentOfB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
      expect(JSON.stringify(res.body)).not.toContain('Bravo Export Contract');
    });

    it("C, party to B's deal, still cannot read B's document", async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${documentOfB}`)
        .set('Authorization', `Bearer ${tokenC}`);
      expect([403, 404]).toContain(res.status);
    });

    it("A cannot update B's document", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/documents/${documentOfB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Seized by Alpha', status: 'verified' });
      expect([403, 404]).toContain(res.status);
    });

    it("A cannot delete B's document", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/documents/${documentOfB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it("A's document list does not leak B's document", async () => {
      const res = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const ids = (res.body.data.items ?? []).map((d: { id: string }) => d.id);
      expect(ids).not.toContain(documentOfB);
    });

    it("B's document survives A's attempts", async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${documentOfB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.title).toBe('Bravo Export Contract');
      expect(res.body.data.status).toBe('uploaded');
      expect(res.body.data.deletedAt ?? null).toBeNull();
    });
  });

  describe('notifications', () => {
    it("B sees B's own notification", async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      const ids = (res.body.data.items ?? []).map((n: { id: string }) => n.id);
      expect(ids).toContain(notificationOfB);
    });

    it("A's notification feed does not leak B's notification", async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const ids = (res.body.data.items ?? []).map((n: { id: string }) => n.id);
      expect(ids).not.toContain(notificationOfB);
      expect(JSON.stringify(res.body)).not.toContain('Bravo-confidential');
    });

    it("A cannot mark B's notification read", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/notifications/${notificationOfB}/read`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});
      expect([403, 404]).toContain(res.status);
    });

    it("A's dismiss of B's notification is a no-op", async () => {
      // This route answers 200 whether or not it matched a row, so the only
      // meaningful assertion is on the row itself.
      await request(app.getHttpServer())
        .patch(`/notifications/${notificationOfB}/dismiss`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      const [row] = await dataSource.query(
        'SELECT is_read, is_archived FROM notifications WHERE id = $1',
        [notificationOfB],
      );
      expect(row.is_read).toBe(false);
      expect(row.is_archived).toBe(false);
    });

    /**
     * Control for the two assertions above: the 404 A gets must be an
     * authorization decision, not a route that is broken for everyone. B's
     * identical request gets past the ownership lookup and reaches the write.
     *
     * It does not currently reach a 200 — see the report: the InitialSchema
     * migration hangs the shared `update_updated_at_column` trigger on
     * `notifications`, a table with no `updated_at` column, so every UPDATE on
     * it raises `record "new" has no field "updated_at"`. That is a separate
     * defect from tenant isolation, so this asserts only what isolation cares
     * about — that B is not turned away as a stranger — and stays correct
     * either side of that fix.
     */
    it("B's own request is not refused as a stranger's", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/notifications/${notificationOfB}/read`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({});
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(403);
    });
  });

  describe('kyc', () => {
    it("B can read B's own KYC status", () => {
      return request(app.getHttpServer())
        .get(`/kyc/status/${orgB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
    });

    it("A cannot read B's KYC status", async () => {
      const res = await request(app.getHttpServer())
        .get(`/kyc/status/${orgB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it("A cannot submit KYC documents for B", async () => {
      const res = await request(app.getHttpServer())
        .post(`/kyc/submit/${orgB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          documents: [
            { type: 'business_registration', documentUrl: 'https://evil.example/forged.pdf' },
          ],
        });
      expect([403, 404]).toContain(res.status);
    });

    it("B's organization is untouched by A's KYC submission", async () => {
      const [row] = await dataSource.query(
        'SELECT status, metadata FROM organizations WHERE id = $1',
        [orgB],
      );
      expect(row.status).not.toBe('pending_verification');
      expect(JSON.stringify(row.metadata ?? {})).not.toContain('evil.example');
    });

    it('A cannot list the admin-only pending review queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/kyc/pending')
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it("A cannot review — and so verify — B's organization", async () => {
      const res = await request(app.getHttpServer())
        .post(`/kyc/review/${orgB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ decision: 'approved', verificationLevel: 'fully_verified' });
      expect([403, 404]).toContain(res.status);

      const [row] = await dataSource.query(
        'SELECT status, verification_level FROM organizations WHERE id = $1',
        [orgB],
      );
      expect(row.status).not.toBe('verified');
      expect(row.verification_level).toBe('none');
    });

    it('B can submit KYC documents for B, and only B sees them', async () => {
      await request(app.getHttpServer())
        .post(`/kyc/submit/${orgB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          documents: [
            { type: 'business_registration', documentUrl: 'https://bravo.example/reg.pdf' },
          ],
        })
        .expect(201);

      const own = await request(app.getHttpServer())
        .get(`/kyc/status/${orgB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(own.body.data.documents).toHaveLength(1);
      expect(own.body.data.documents[0].documentUrl).toBe('https://bravo.example/reg.pdf');

      const stranger = await request(app.getHttpServer())
        .get(`/kyc/status/${orgB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(stranger.status);
      expect(JSON.stringify(stranger.body)).not.toContain('bravo.example');
    });
  });

  describe('organizations', () => {
    /**
     * PATCH and DELETE /organizations/:id took the id from the path with no
     * acting organization — the handlers had no req parameter at all.
     * @Roles('owner') only asserts the caller owns *some* organization, so any
     * owner could rewrite or soft-delete any organization on the platform.
     * Demonstrated before the fix: A patched B's description (200) and then
     * soft-deleted B's organization (204).
     */
    it("A cannot modify B's organization", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/organizations/${orgB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'seized by alpha' });
      expect([403, 404]).toContain(res.status);

      const [row] = await dataSource.query(
        'SELECT description FROM organizations WHERE id = $1',
        [orgB],
      );
      expect(row.description ?? '').not.toBe('seized by alpha');
    });

    it("A cannot delete B's organization", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/organizations/${orgB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);

      const [row] = await dataSource.query(
        'SELECT deleted_at FROM organizations WHERE id = $1',
        [orgB],
      );
      expect(row.deleted_at).toBeNull();
    });

    it('B can still modify its own organization — the control', async () => {
      const marker = `owned by bravo ${Date.now()}`;
      await request(app.getHttpServer())
        .patch(`/organizations/${orgB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ description: marker })
        .expect(200);

      const [row] = await dataSource.query(
        'SELECT description FROM organizations WHERE id = $1',
        [orgB],
      );
      expect(row.description).toBe(marker);
    });
  });

  describe('takeover and disclosure via path-id handlers', () => {
    /**
     * These three handlers took an id from the path and never received the
     * request, so they could not scope to the caller at all. The route audit
     * now flags that shape; these assert the specific consequences.
     */
    it("A cannot add itself to B's organization", async () => {
      const res = await request(app.getHttpServer())
        .post(`/organizations/${orgB}/members`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userC, role: 'admin' });
      expect([403, 404]).toContain(res.status);

      const rows = await dataSource.query(
        'SELECT user_id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [orgB, userC],
      );
      expect(rows.length).toBe(0);
    });

    it("A cannot read B's deal-room messages", async () => {
      const res = await request(app.getHttpServer())
        .get(`/messages/deal/${dealOfBC}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it('B, a party to the deal, can read its messages — the control', async () => {
      const res = await request(app.getHttpServer())
        .get(`/messages/deal/${dealOfBC}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
    });

    it("A cannot list the members of B's organization", async () => {
      const res = await request(app.getHttpServer())
        .get(`/organizations/${orgB}/members`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it('the member roster carries no password hash and no MFA secret', async () => {
      // This route loads the user relation. The secret columns on the user
      // entity were selectable, so before the fix a stranger calling it
      // received, for every member of any organization on the platform, the
      // live bcrypt hash and the AES-wrapped TOTP secret — enough to attack
      // the password offline and then produce valid second-factor codes.
      // Verified against a running server: status 200, and the response
      // carried passwordHash, mfaSecret and mfaPendingSecret.
      const res = await request(app.getHttpServer())
        .get(`/organizations/${orgB}/members`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      const serialised = JSON.stringify(res.body);
      for (const secret of [
        'passwordHash',
        'mfaSecret',
        'mfaPendingSecret',
        'mfaLastVerifiedCounter',
      ]) {
        expect(serialised).not.toContain(secret);
      }
      // Still useful as a roster.
      expect(res.body.data[0].user.email).toBeTruthy();
      expect(res.body.data[0].role).toBeTruthy();
    });

    it('a plain user load leaves the secret columns behind', async () => {
      // The durable half of the fix: the columns are select: false, so this
      // holds for any future query that joins a user, not just this route.
      const [row] = await dataSource.query('SELECT id FROM organizations WHERE id = $1', [orgB]);
      expect(row).toBeTruthy();

      const users = await dataSource
        .getRepository('User')
        .find({ where: { id: userB }, take: 1 });
      expect(users.length).toBe(1);
      expect((users[0] as any).passwordHash).toBeUndefined();
      expect((users[0] as any).mfaSecret).toBeUndefined();
    });

    it("A cannot read B's API keys", async () => {
      const res = await request(app.getHttpServer())
        .get(`/enterprise/api-keys/${orgB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('payments', () => {
    /**
     * A payment belongs to the payer and the payee and nobody else. All four
     * of these handlers took an id from the path with no request: a stranger
     * could read another company's payment, list every payment on someone
     * else's deal, read its totals, and — on PATCH :id/status — move it
     * between states. @Roles asserted only that the caller held a finance role
     * within their own organization.
     */
    let paymentOfBC: string;

    beforeAll(async () => {
      const [row] = await dataSource.query(
        `INSERT INTO payments
           (deal_id, payer_org_id, payee_org_id, amount, currency, payment_method, status)
         VALUES ($1, $2, $3, 25000, 'USD', 'bank_transfer', 'pending') RETURNING id`,
        [dealOfBC, orgB, orgC],
      );
      paymentOfBC = row.id;
    });

    it("A cannot read B and C's payment", async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/${paymentOfBC}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it('B, the payer, can read it — the control', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/${paymentOfBC}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(paymentOfBC);
    });

    it('C, the payee, can read it too', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/${paymentOfBC}`)
        .set('Authorization', `Bearer ${tokenC}`);
      expect(res.status).toBe(200);
    });

    it("A cannot mark B and C's payment as paid", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/payments/${paymentOfBC}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'completed' });
      expect([403, 404]).toContain(res.status);

      // The denial has to have prevented the write, not merely returned an
      // error after making it.
      const [row] = await dataSource.query('SELECT status FROM payments WHERE id = $1', [
        paymentOfBC,
      ]);
      expect(row.status).toBe('pending');
    });

    it("A cannot list the payments on B and C's deal", async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/deal/${dealOfBC}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it("A cannot read the payment totals on B and C's deal", async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/deal/${dealOfBC}/summary`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it('B can list the payments on its own deal — the control', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/deal/${dealOfBC}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
    });
  });

  describe('inventory', () => {
    /**
     * Two of these routes took the organization straight off the query string,
     * and three took a warehouse or item id with no request at all. So a
     * caller could enumerate another company's warehouses, read its stock
     * valuation, and re-quantity or re-status its goods.
     *
     * The store behind these endpoints is in-process and non-durable, so this
     * block creates what it reads within the same instance.
     */
    let warehouseOfB: string;
    let itemOfB: string;

    beforeAll(async () => {
      const wh = await request(app.getHttpServer())
        .post('/inventory/warehouses')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          name: `B Warehouse ${uniq()}`,
          location: { country: 'KE', city: 'Nairobi', address: 'Enterprise Road' },
          type: 'origin',
          capacity: 100000,
          certifications: ['ISO-9001'],
          active: true,
        })
        .expect(201);
      warehouseOfB = wh.body.data.id;

      const item = await request(app.getHttpServer())
        .post('/inventory/items')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          warehouseId: warehouseOfB,
          warehouseName: 'ignored, taken from the warehouse',
          location: { country: 'KE', city: 'Nairobi', address: 'Enterprise Road' },
          productId: productOfB,
          productName: 'Green coffee',
          quantity: 5000,
          unit: 'kg',
          quality: 'AA',
          status: 'available',
          metadata: { price: 5 },
        })
        .expect(201);
      itemOfB = item.body.data.id;
    });

    it('a warehouse is owned by the caller who created it, not by the body', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/warehouses/${warehouseOfB}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.orgId).toBe(orgB);
    });

    it("A cannot read B's warehouse", async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/warehouses/${warehouseOfB}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it("A cannot list the stock in B's warehouse", async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/warehouses/${warehouseOfB}/items`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([403, 404]).toContain(res.status);
    });

    it("A's warehouse list does not include B's warehouse", async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory/warehouses')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const ids = res.body.data.map((w: { id: string }) => w.id);
      expect(ids).not.toContain(warehouseOfB);
    });

    it("A cannot see B's stock of a product", async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/products/${productOfB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.data).toEqual([]);
    });

    it("A cannot re-quantity B's stock", async () => {
      const res = await request(app.getHttpServer())
        .put(`/inventory/items/${itemOfB}/quantity`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ quantity: 0 });
      expect([403, 404]).toContain(res.status);

      const check = await request(app.getHttpServer())
        .get(`/inventory/warehouses/${warehouseOfB}/items`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(check.body.data.find((i: { id: string }) => i.id === itemOfB).quantity).toBe(5000);
    });

    it("A cannot re-status B's stock", async () => {
      const res = await request(app.getHttpServer())
        .put(`/inventory/items/${itemOfB}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'sold' });
      expect([403, 404]).toContain(res.status);
    });

    it("A cannot place stock in B's warehouse", async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          warehouseId: warehouseOfB,
          warehouseName: 'intruder',
          location: { country: 'KE', city: 'Nairobi', address: 'x' },
          productId: productOfB,
          productName: 'Not mine',
          quantity: 1,
          unit: 'kg',
          quality: 'AA',
          status: 'available',
          metadata: {},
        });
      expect([403, 404]).toContain(res.status);
    });

    it("A's summary does not count B's stock", async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory/summary')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.data.totalItems).toBe(0);
      expect(res.body.data.totalValue).toBe(0);
    });

    it('B sees its own stock and its value — the control', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory/summary')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.data.totalItems).toBe(1);
      expect(res.body.data.totalValue).toBe(25000);
    });
  });

  describe('enterprise and analytics, scoped by orgId', () => {
    /**
     * These routes name the organization directly — five reads take it from
     * the path, and five writes used to take it from the request body. An
     * organization id is not a secret: the marketplace directory hands them
     * out. So "knows the id" was the whole access check.
     *
     * The body-supplied ones never appeared in the route audit at all, which
     * only inspects path parameters. They are the reason the audit's own
     * documentation now says so.
     */
    const forbidden = (res: { status: number }) => expect([403, 404]).toContain(res.status);

    it("A cannot read B's trade analytics", async () => {
      forbidden(
        await request(app.getHttpServer())
          .get(`/analytics/organization/${orgB}`)
          .set('Authorization', `Bearer ${tokenA}`),
      );
    });

    it('B can read its own — the control', async () => {
      const res = await request(app.getHttpServer())
        .get(`/analytics/organization/${orgB}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
    });

    it('counts the supplier side of a deal, not just the buyer side', async () => {
      // C is the supplier on the B–C deal and is the buyer on nothing. When
      // this only counted buyerOrgId it reported zero deals and zero volume
      // for every supplier on the platform — a wrong number rather than an
      // error, so nothing failed and nobody would have noticed until a
      // supplier asked why its dashboard was empty.
      const res = await request(app.getHttpServer())
        .get(`/analytics/organization/${orgC}`)
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);

      expect(res.body.data.totalDeals).toBeGreaterThan(0);
    });

    it("A cannot read B's subscription", async () => {
      forbidden(
        await request(app.getHttpServer())
          .get(`/enterprise/subscriptions/${orgB}`)
          .set('Authorization', `Bearer ${tokenA}`),
      );
    });

    it("A cannot read B's sustainability score or ESG report", async () => {
      forbidden(
        await request(app.getHttpServer())
          .get(`/enterprise/esg/score/${orgB}`)
          .set('Authorization', `Bearer ${tokenA}`),
      );
      forbidden(
        await request(app.getHttpServer())
          .get(`/enterprise/esg/report/${orgB}?period=2026-Q1`)
          .set('Authorization', `Bearer ${tokenA}`),
      );
    });

    it("A cannot read B's white-label configuration", async () => {
      forbidden(
        await request(app.getHttpServer())
          .get(`/enterprise/white-label/${orgB}`)
          .set('Authorization', `Bearer ${tokenA}`),
      );
    });

    it("A cannot read the supplier matches computed for B", async () => {
      forbidden(
        await request(app.getHttpServer())
          .get(`/enterprise/matches/buyer/${orgB}`)
          .set('Authorization', `Bearer ${tokenA}`),
      );
    });

    it('an API key created by A belongs to A, whatever the body says', async () => {
      const created = await request(app.getHttpServer())
        .post('/enterprise/api-keys')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ orgId: orgB, name: 'planted', scopes: ['read'] });

      if (created.status < 400) {
        expect(created.body.data.orgId).toBe(orgA);
      }

      // And B's own key list does not contain it.
      const bsKeys = await request(app.getHttpServer())
        .get(`/enterprise/api-keys/${orgB}`)
        .set('Authorization', `Bearer ${tokenB}`);
      if (bsKeys.status === 200) {
        expect(
          bsKeys.body.data.some((k: { name: string }) => k.name === 'planted'),
        ).toBe(false);
      }
    });

    it('a subscription created by A belongs to A, whatever the body says', async () => {
      const created = await request(app.getHttpServer())
        .post('/enterprise/subscriptions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ orgId: orgB, tierId: 'growth', billingCycle: 'monthly' });

      if (created.status < 400) {
        expect(created.body.data.orgId).toBe(orgA);
      }

      const bs = await request(app.getHttpServer())
        .get(`/enterprise/subscriptions/${orgB}`)
        .set('Authorization', `Bearer ${tokenB}`);
      if (bs.status === 200 && bs.body.data) {
        expect(bs.body.data.tierId).not.toBe('growth');
      }
    });

    it('a white-label configuration created by A belongs to A', async () => {
      const created = await request(app.getHttpServer())
        .post('/enterprise/white-label')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ orgId: orgB, config: { brandName: 'Planted', primaryColor: '#000000' } });

      if (created.status < 400) {
        expect(created.body.data.orgId).toBe(orgA);
      }
    });
  });

  describe('unauthenticated access', () => {
    it('rejects requests with no token', () => {
      return request(app.getHttpServer()).get('/organizations').expect(401);
    });

    it('rejects requests with a malformed token', () => {
      return request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });
});
