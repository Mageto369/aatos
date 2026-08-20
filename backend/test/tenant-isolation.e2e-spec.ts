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
