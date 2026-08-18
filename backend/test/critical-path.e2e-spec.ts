import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Critical Path — Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register — should register a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `test-${Date.now()}@aatos.trade`,
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('user');
      });
  });

  it('POST /auth/login — should authenticate with valid credentials', async () => {
    const email = `login-${Date.now()}@aatos.trade`;
    const password = 'SecurePass123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, firstName: 'Login', lastName: 'Test' });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('user');
      });
  });

  it('POST /auth/login — should reject invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nonexistent@aatos.trade', password: 'wrong' })
      .expect(401);
  });

  it('GET /auth/me — should return current user with valid token', async () => {
    const email = `me-${Date.now()}@aatos.trade`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SecurePass123!', firstName: 'Me', lastName: 'Test' });

    const token = registerRes.body.data.accessToken;

    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.email).toBe(email);
      });
  });
});

describe('Critical Path — Organization (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `org-test-${Date.now()}@aatos.trade`,
        password: 'SecurePass123!',
        firstName: 'Org',
        lastName: 'Test',
      });
    authToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /organizations — should create an organization', () => {
    return request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Test Coffee Cooperative ${Date.now()}`,
        type: 'cooperative',
        countryCode: 'KE',
        city: 'Nairobi',
        description: 'Test organization for critical path',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toContain('Test Coffee Cooperative');
        expect(res.body.data.status).toBe('draft');
      });
  });

  it('GET /organizations — should list organizations', () => {
    return request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('items');
        expect(Array.isArray(res.body.data.items)).toBe(true);
      });
  });
});

describe('Critical Path — Product (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let orgId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const authRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `product-test-${Date.now()}@aatos.trade`,
        password: 'SecurePass123!',
        firstName: 'Product',
        lastName: 'Test',
      });
    authToken = authRes.body.data.accessToken;

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Product Test Org ${Date.now()}`,
        type: 'cooperative',
        countryCode: 'KE',
      });
    orgId = orgRes.body.data.id;

    // POST /products resolves dto.categoryId against product_categories and
    // 404s when it is absent. Migrations create the table but seed no rows, so
    // the suite provisions the one category it needs and keeps itself
    // independent of seed data.
    const dataSource = app.get(DataSource);
    const suffix = Date.now();
    const [category] = await dataSource.query(
      `INSERT INTO product_categories (group_type, name, slug, code)
       VALUES ('beverage_crops', $1, $2, $3)
       RETURNING id`,
      [`Green Coffee ${suffix}`, `green-coffee-${suffix}`, `GC${suffix}`],
    );
    categoryId = category.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /products — should create a product', () => {
    return request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Kenya AA Green Coffee',
        categoryId,
        attributes: { grade: 'AA', process: 'washed', screenSize: '17/18' },
        originCountry: 'KE',
        availableQuantity: 10000,
        availableUnit: 'kg',
        priceFob: 4.5,
        incoterm: 'FOB',
      })
      .expect(201);
  });
});
