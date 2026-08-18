import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

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
 */
describe('Tenant isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Two unrelated tenants.
  let tokenA: string;
  let orgA: string;
  let tokenB: string;
  let orgB: string;

  let inspectionOfB: string;
  let productOfB: string;

  const password = 'SecurePass123!';

  async function createTenant(label: string) {
    const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aatos.trade`;
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, firstName: label, lastName: 'Tenant' })
      .expect(201);
    const token = reg.body.data.accessToken;

    const org = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `${label} Org ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'cooperative',
        countryCode: 'KE',
      })
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

    ({ token: tokenA, orgId: orgA } = await createTenant('alpha'));
    ({ token: tokenB, orgId: orgB } = await createTenant('bravo'));

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
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [category] = await dataSource.query(
      `INSERT INTO product_categories (group_type, name, slug, code)
       VALUES ('beverage_crops', $1, $2, $3) RETURNING id`,
      [`Isolation Coffee ${suffix}`, `isolation-coffee-${suffix}`, `IC${Date.now()}`],
    );

    const product = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Bravo Lot',
        categoryId: category.id,
        attributes: { grade: 'AA' },
        originCountry: 'KE',
        availableQuantity: 500,
        availableUnit: 'kg',
      })
      .expect(201);
    productOfB = product.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets up two distinct organizations', () => {
    expect(orgA).toBeTruthy();
    expect(orgB).toBeTruthy();
    expect(orgA).not.toBe(orgB);
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
