import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

/**
 * The trade lifecycle, end to end.
 *
 * This is the product: a buyer publishes an RFQ, suppliers quote, the buyer
 * accepts one, and the platform converts that into a deal with milestones and
 * a compliance checklist. Every other test in this repository exercises a
 * single endpoint; nothing has ever verified that the sequence works.
 *
 * Modelled on the pilot: a Kenyan cooperative selling green specialty coffee
 * to a U.S. importer.
 */
describe('Trade lifecycle — Kenya to U.S. green coffee (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let buyerToken: string;
  let buyerOrg: string;
  let supplierAToken: string;
  let supplierAOrg: string;
  let supplierBToken: string;
  let categoryId: string;

  let rfqId: string;
  let quoteAId: string;
  let quoteBId: string;
  let dealId: string;

  const password = 'SecurePass123!';
  const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  async function tenant(label: string, countryCode: string) {
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uniq()}@aatos.trade`,
        password,
        firstName: label.split(' ')[0],
        lastName: 'Co',
      })
      .expect(201);
    const token = reg.body.data.accessToken;

    const org = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `${label} ${uniq()}`, type: 'cooperative', countryCode })
      .expect(201);

    return { token, orgId: org.body.data.id as string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = app.get(DataSource);

    ({ token: buyerToken, orgId: buyerOrg } = await tenant('US Importer', 'US'));
    ({ token: supplierAToken, orgId: supplierAOrg } = await tenant('Nyeri Cooperative', 'KE'));
    ({ token: supplierBToken } = await tenant('Kirinyaga Estate', 'KE'));

    const s = uniq();
    const [category] = await dataSource.query(
      `INSERT INTO product_categories (group_type, name, slug, code)
       VALUES ('beverage_crops', $1, $2, $3) RETURNING id`,
      [`Green Coffee ${s}`, `green-coffee-${s}`, `GC${Date.now()}`],
    );
    categoryId = category.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. buyer creates an RFQ for green coffee', async () => {
    const res = await request(app.getHttpServer())
      .post('/rfqs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Kenya AA green coffee, 2 x 20ft container',
        productCategoryId: categoryId,
        specifications: { grade: 'AA', process: 'washed', cuppingScore: '85+' },
        requiredQuantity: 38000,
        requiredUnit: 'kg',
        destinationCountry: 'US',
        responseDeadline: new Date(Date.now() + 14 * 864e5).toISOString(),
        paymentTerms: '30% advance, 70% against documents',
      })
      .expect(201);

    rfqId = res.body.data.id;
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.buyerOrgId).toBe(buyerOrg);
  });

  it('2. an unpublished RFQ does not accept quotations', () => {
    return request(app.getHttpServer())
      .post(`/rfqs/${rfqId}/quotes`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .send({
        quantityOffered: 38000,
        quantityUnit: 'kg',
        unitPrice: 5.1,
        pricePerUnit: 'kg',
        priceCurrency: 'USD',
        totalPrice: 193800,
        incoterm: 'FOB',
      })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
  });

  it('3. buyer publishes the RFQ', async () => {
    const res = await request(app.getHttpServer())
      .post(`/rfqs/${rfqId}/publish`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);

    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  it('4. two suppliers quote against it', async () => {
    const a = await request(app.getHttpServer())
      .post(`/rfqs/${rfqId}/quotes`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .send({
        quantityOffered: 38000,
        quantityUnit: 'kg',
        unitPrice: 5.1,
        pricePerUnit: 'kg',
        priceCurrency: 'USD',
        totalPrice: 193800,
        incoterm: 'FOB',
        paymentTerms: '30% advance, 70% against documents',
        validityDays: 30,
      })
      .expect(201);
    quoteAId = a.body.data.id;
    expect(a.body.data.status).toBe('sent');

    const b = await request(app.getHttpServer())
      .post(`/rfqs/${rfqId}/quotes`)
      .set('Authorization', `Bearer ${supplierBToken}`)
      .send({
        quantityOffered: 38000,
        quantityUnit: 'kg',
        unitPrice: 5.45,
        pricePerUnit: 'kg',
        priceCurrency: 'USD',
        totalPrice: 207100,
        incoterm: 'FOB',
        validityDays: 30,
      })
      .expect(201);
    quoteBId = b.body.data.id;
  });

  it('5. buyer sees both quotations', async () => {
    const res = await request(app.getHttpServer())
      .get(`/rfqs/${rfqId}/quotes`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    const ids = res.body.data.map((q: { id: string }) => q.id);
    expect(ids).toContain(quoteAId);
    expect(ids).toContain(quoteBId);
  });

  it('6. buyer accepts the cheaper quote, creating a deal', async () => {
    const res = await request(app.getHttpServer())
      .post(`/rfqs/${rfqId}/quotes/${quoteAId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);

    expect(res.body.data.success).toBe(true);
    dealId = res.body.data.dealId;
    expect(dealId).toBeTruthy();
  });

  it('7. the deal carries both parties, the agreed price and the 1% platform fee', async () => {
    const res = await request(app.getHttpServer())
      .get(`/deals/${dealId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    const deal = res.body.data;
    expect(deal.buyerOrgId).toBe(buyerOrg);
    expect(deal.supplierOrgId).toBe(supplierAOrg);
    expect(deal.rfqId).toBe(rfqId);
    expect(deal.winningQuotationId).toBe(quoteAId);
    expect(Number(deal.totalValueUsd)).toBe(193800);
    expect(Number(deal.platformFeeUsd)).toBeCloseTo(1938, 2);
    expect(deal.status).toBe('negotiating');
  });

  it('8. accepting the quote awards the RFQ', async () => {
    const res = await request(app.getHttpServer())
      .get(`/rfqs/${rfqId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('awarded');
  });

  it('9. the winning quote is accepted and the losing quote is rejected', async () => {
    const res = await request(app.getHttpServer())
      .get(`/rfqs/${rfqId}/quotes`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    const byId = Object.fromEntries(
      res.body.data.map((q: { id: string; status: string }) => [q.id, q.status]),
    );
    expect(byId[quoteAId]).toBe('accepted');
    // A losing quote left at 'sent' stays live in the supplier's pipeline and
    // can still be accepted later against an already-awarded RFQ.
    expect(byId[quoteBId]).toBe('rejected');
  });

  it('10. the deal is created with milestones', async () => {
    const res = await request(app.getHttpServer())
      .get(`/deals/${dealId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data.milestones)).toBe(true);
    expect(res.body.data.milestones.length).toBeGreaterThan(0);
  });

  it('11. a compliance checklist is attached to the deal', async () => {
    const [row] = await dataSource.query(
      `SELECT compliance_checklist_id FROM deals WHERE id = $1`,
      [dealId],
    );
    expect(row.compliance_checklist_id).toBeTruthy();

    const [checklist] = await dataSource.query(
      `SELECT origin_country, destination_country FROM compliance_checklists WHERE id = $1`,
      [row.compliance_checklist_id],
    );
    expect(checklist.destination_country).toBe('US');
    // Origin drives which corridor's rules apply. The pilot is Kenya to the
    // U.S.; a blank origin cannot resolve to any rule set.
    expect(checklist.origin_country).toBe('KE');
  });

  it('12. the supplier can see the deal it won', async () => {
    const res = await request(app.getHttpServer())
      .get(`/deals/${dealId}`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .expect(200);

    expect(res.body.data.id).toBe(dealId);
  });

  it('13. an unrelated supplier cannot see the deal', () => {
    return request(app.getHttpServer())
      .get(`/deals/${dealId}`)
      .set('Authorization', `Bearer ${supplierBToken}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });
});
