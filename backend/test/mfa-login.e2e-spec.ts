import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { authenticator } from 'otplib';
import { AppModule } from '../src/app.module';
import { RateLimitStore } from '../src/common/rate-limit.guard';

/**
 * Real TOTP enrolment and a real second-factor login, against a real database.
 *
 * This exists because passwordHash, mfaSecret, mfaPendingSecret and
 * mfaLastVerifiedCounter are `select: false` — a relation load was handing
 * every member's bcrypt hash and TOTP secret to any caller — and the columns
 * now have to be named by any query that needs them. The unit suites cover
 * that logic against a fake repository whose addSelect is a no-op, so they
 * cannot tell whether the real query actually returns the secrets. If the
 * projection were wrong, bcrypt would compare against undefined and every
 * login on the platform would fail; nothing else in the suite would notice,
 * because every other test registers and logs in without MFA.
 *
 * So: enrol for real, confirm with a generated code, log in with a second
 * generated code, and check the replay counter refuses the same code twice.
 */
describe('MFA login (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let rateLimits: RateLimitStore;

  /**
   * Login is throttled to five attempts per quarter hour per caller, and this
   * suite deliberately spends most of them on refusals before it gets to the
   * recovery code. Clearing the counter between cases keeps the subject of
   * each test the second factor rather than the throttle — which is doing
   * exactly its job here, and has its own coverage in
   * src/common/tests/rate-limit-store.spec.ts.
   */
  const clearLoginThrottle = async () => {
    for (const identifier of ['::ffff:127.0.0.1', '127.0.0.1', '::1', 'anonymous']) {
      await rateLimits.reset(`strict:${identifier}:/auth/login`);
    }
  };

  const password = 'SecurePass123!';
  const email = `mfa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aatos.trade`;

  let token: string;
  let secret: string;
  let recoveryCodes: string[];
  /** The code test 7 spends, kept verbatim so test 9 replays that exact code. */
  let acceptedCode: string;

  // Must match mfa.service.ts: step 30, 6 digits.
  const totp = authenticator.clone({ step: 30, digits: 6 });

  /**
   * A code for the current step, or `steps` steps ahead.
   *
   * The offset is not decoration. Confirming enrolment records the counter of
   * the code that proved it, and verification refuses any counter at or below
   * the last one used. So the code that logs in afterwards has to belong to a
   * later step than the one that enrolled, or it is indistinguishable from a
   * replay — correctly, since it is literally the same six digits. The server
   * accepts one step of drift either way, which makes the next step's code
   * both valid and above the stored counter.
   */
  const codeFor = (secretValue: string, steps = 0) =>
    totp.clone({ epoch: Date.now() + steps * 30_000 }).generate(secretValue);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = app.get(DataSource);
    rateLimits = app.get(RateLimitStore);

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, firstName: 'Mfa', lastName: 'User' })
      .expect(201);
    token = reg.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(clearLoginThrottle);

  it('1. enrolment returns an otpauth URL and a secret', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/mfa/enroll')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    secret = res.body.data.secret;
    expect(secret).toBeTruthy();
    expect(res.body.data.otpauthUrl).toContain('otpauth://totp/');
  });

  it('2. the pending secret is stored encrypted, not in the clear', async () => {
    const [row] = await dataSource.query(
      'SELECT mfa_pending_secret, mfa_secret, mfa_enabled FROM users WHERE email = $1',
      [email],
    );
    expect(row.mfa_pending_secret).toBeTruthy();
    expect(row.mfa_pending_secret).not.toContain(secret);
    // Not promoted until proven, so a half-finished enrolment cannot lock
    // anyone out of their own account.
    expect(row.mfa_secret).toBeNull();
    expect(row.mfa_enabled).toBe(false);
  });

  it('3. a wrong code does not confirm enrolment', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(res.status).toBe(401);
  });

  it('4. the generated code confirms enrolment and returns recovery codes', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: codeFor(secret) })
      .expect(200);

    recoveryCodes = res.body.data.recoveryCodes;
    expect(Array.isArray(recoveryCodes)).toBe(true);
    expect(recoveryCodes.length).toBeGreaterThan(0);
  });

  it('5. login with the right password but no code is refused', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);

    // The discriminator the client branches on. The problem+json filter used
    // to drop it, leaving only the English prose in `detail`.
    expect(res.body.code).toBe('mfa_required');
    expect(res.body.detail).toContain('Multi-factor authentication code required');
  });

  it('6. login with the right password and a wrong code is refused', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, mfaCode: '000000' })
      .expect(401);

    expect(res.body.code).toBe('mfa_invalid');
  });

  it('7. login with the right password and a live code succeeds', async () => {
    // The load-bearing assertion for select: false. If login did not name
    // passwordHash and mfaSecret, this is where it breaks.
    acceptedCode = codeFor(secret, 1);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, mfaCode: acceptedCode })
      .expect(200);

    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('8. a wrong password is still refused even with a valid code', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'NotThePassword1!', mfaCode: codeFor(secret, 2) })
      .expect(401);
  });

  it('9. the accepted code cannot be replayed', async () => {
    // mfaLastVerifiedCounter is select: false too. Were it not loaded, the
    // counter would read as null on every verification and each code would
    // stay usable for its whole step plus the drift window.
    const [before] = await dataSource.query(
      'SELECT mfa_last_verified_counter FROM users WHERE email = $1',
      [email],
    );
    expect(before.mfa_last_verified_counter).not.toBeNull();

    // The same six digits that just worked, not a freshly generated code —
    // this is what an attacker replaying a captured code actually sends.
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, mfaCode: acceptedCode });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('mfa_invalid');
  });

  it('10. a recovery code logs in, and only once', async () => {
    const code = recoveryCodes[0];

    const first = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, recoveryCode: code })
      .expect(200);
    expect(first.body.data.accessToken).toBeTruthy();

    const second = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, recoveryCode: code });
    expect(second.status).toBe(401);
  });
});
