import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { MfaService } from '../mfa.service';
import { MfaCryptoService } from '../services/mfa-crypto.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { User } from '../entities/user.entity';
import { MfaRecoveryCode } from '../entities/mfa-recovery-code.entity';
import { OrganizationMember } from '../../organizations/entities/organization-member.entity';
import {
  FakeMemberRepository,
  FakeRecoveryCodeRepository,
  FakeUserRepository,
  fakeConfigService,
  makeUser,
} from './mfa-test-doubles';

const PASSWORD = 'CorrectHorseBattery1!';
const NOW = new Date('2026-03-04T10:15:30.000Z').getTime();
const STEP_MS = 30_000;

function codeAt(secret: string, epochMs: number): string {
  return authenticator.clone({ step: 30, digits: 6, epoch: epochMs }).generate(secret);
}

/**
 * Login with a second factor, exercised through AuthService with a real
 * MfaService behind it — the layer where the old simulation's fixed codes
 * would actually have let someone in.
 */
describe('AuthService login with MFA', () => {
  let auth: AuthService;
  let mfa: MfaService;
  let users: FakeUserRepository;
  let members: FakeMemberRepository;
  let passwordHash: string;

  beforeAll(async () => {
    // Low cost factor: these tests care about the second factor, not about how
    // slow bcrypt is.
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(async () => {
    jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });

    users = new FakeUserRepository();
    members = new FakeMemberRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        MfaService,
        MfaCryptoService,
        { provide: ConfigService, useValue: fakeConfigService() },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(MfaRecoveryCode), useValue: new FakeRecoveryCodeRepository() },
        { provide: getRepositoryToken(OrganizationMember), useValue: members },
        { provide: JwtService, useValue: { sign: () => 'signed-access-token' } },
        { provide: RefreshTokenService, useValue: { createToken: jest.fn() } },
      ],
    }).compile();

    auth = module.get(AuthService);
    mfa = module.get(MfaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function enrolledUser(): Promise<{
    user: User;
    secret: string;
    recoveryCodes: string[];
  }> {
    const user = users.add(makeUser({ email: 'owner@example.com', passwordHash }));
    const challenge = await mfa.beginEnrolment(user.id);
    const { recoveryCodes } = await mfa.confirmEnrolment(
      user.id,
      codeAt(challenge.secret, Date.now()),
    );
    // Move off the confirming step so the enrolment code is not still live.
    jest.setSystemTime(NOW + STEP_MS);
    return { user, secret: challenge.secret, recoveryCodes };
  }

  it('lets a user without MFA log in on password alone', async () => {
    users.add(makeUser({ email: 'plain@example.com', passwordHash }));

    const result = await auth.login({ email: 'plain@example.com', password: PASSWORD });

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.user.mfaEnabled).toBe(false);
  });

  it('refuses the password alone once MFA is enabled', async () => {
    await enrolledUser();

    await expect(
      auth.login({ email: 'owner@example.com', password: PASSWORD }),
    ).rejects.toMatchObject({
      response: { code: 'mfa_required' },
    });
  });

  it('accepts a live TOTP code', async () => {
    const { secret } = await enrolledUser();

    const result = await auth.login({
      email: 'owner@example.com',
      password: PASSWORD,
      mfaCode: codeAt(secret, Date.now()),
    });

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.user.mfaEnabled).toBe(true);
  });

  it('rejects a wrong TOTP code', async () => {
    const { secret } = await enrolledUser();
    const valid = codeAt(secret, Date.now());
    const wrong = String((Number(valid) + 3) % 1_000_000).padStart(6, '0');

    await expect(
      auth.login({ email: 'owner@example.com', password: PASSWORD, mfaCode: wrong }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a code from outside the drift window', async () => {
    const { secret } = await enrolledUser();
    const stale = codeAt(secret, Date.now() - 4 * STEP_MS);

    await expect(
      auth.login({ email: 'owner@example.com', password: PASSWORD, mfaCode: stale }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('will not accept the same TOTP code twice', async () => {
    const { secret } = await enrolledUser();
    const code = codeAt(secret, Date.now());

    await expect(
      auth.login({ email: 'owner@example.com', password: PASSWORD, mfaCode: code }),
    ).resolves.toBeDefined();

    await expect(
      auth.login({ email: 'owner@example.com', password: PASSWORD, mfaCode: code }),
    ).rejects.toThrow(UnauthorizedException);
  });

  describe('the simulation backdoors are dead at the login boundary', () => {
    // mfa.service.ts previously returned true for '000000' when NODE_ENV was
    // 'development' and for '123456' unconditionally. fakeConfigService reports
    // NODE_ENV=development here, which is the more permissive of the two.
    it.each(['000000', '123456'])(
      'refuses to log in with the former backdoor code %s',
      async (backdoor) => {
        const { user, secret } = await enrolledUser();

        // Not a coincidental collision with the genuine code.
        expect(codeAt(secret, Date.now())).not.toBe(backdoor);

        await expect(
          auth.login({ email: 'owner@example.com', password: PASSWORD, mfaCode: backdoor }),
        ).rejects.toThrow(UnauthorizedException);

        // And the attempt was counted, rather than silently ignored.
        expect(user.failedLoginCount).toBe(1);
        expect(user.lastLoginAt).toBeNull();
      },
    );

    it.each(['000000', '123456'])(
      'refuses the former backdoor code %s as a recovery code',
      async (backdoor) => {
        await enrolledUser();

        await expect(
          auth.login({ email: 'owner@example.com', password: PASSWORD, recoveryCode: backdoor }),
        ).rejects.toThrow(UnauthorizedException);
      },
    );

    it('locks the account after repeated backdoor guesses', async () => {
      const { user } = await enrolledUser();

      for (let attempt = 0; attempt < 5; attempt++) {
        await expect(
          auth.login({ email: 'owner@example.com', password: PASSWORD, mfaCode: '000000' }),
        ).rejects.toThrow(UnauthorizedException);
      }

      expect(user.failedLoginCount).toBe(5);
      expect(user.lockedUntil).toBeInstanceOf(Date);

      // Even the correct password now bounces, so the code space cannot be
      // walked at leisure.
      await expect(
        auth.login({ email: 'owner@example.com', password: PASSWORD }),
      ).rejects.toThrow('Account temporarily locked');
    });
  });

  describe('recovery codes at login', () => {
    it('accepts a recovery code once and refuses it the second time', async () => {
      const { recoveryCodes } = await enrolledUser();
      const code = recoveryCodes[0];

      const result = await auth.login({
        email: 'owner@example.com',
        password: PASSWORD,
        recoveryCode: code,
      });
      expect(result.accessToken).toBe('signed-access-token');

      await expect(
        auth.login({ email: 'owner@example.com', password: PASSWORD, recoveryCode: code }),
      ).rejects.toMatchObject({ response: { code: 'mfa_invalid' } });
    });

    it('rejects a recovery code that was never issued', async () => {
      await enrolledUser();

      await expect(
        auth.login({
          email: 'owner@example.com',
          password: PASSWORD,
          recoveryCode: 'ZZZZZ-ZZZZZ',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('privileged role enforcement', () => {
    it('flags an un-enrolled privileged user so the client can enrol them', async () => {
      const user = users.add(makeUser({ email: 'admin@example.com', passwordHash }));
      members.rows.push({ userId: user.id, role: 'admin' } as OrganizationMember);

      const result = await auth.login({ email: 'admin@example.com', password: PASSWORD });

      // The token is issued — enrolling requires one — but MfaEnrolmentGuard
      // refuses it everywhere except the enrolment routes.
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.mfaEnrolmentRequired).toBe(true);
    });

    it('clears the flag once the privileged user has enrolled', async () => {
      const { user, secret } = await enrolledUser();
      members.rows.push({ userId: user.id, role: 'owner' } as OrganizationMember);

      const result = await auth.login({
        email: 'owner@example.com',
        password: PASSWORD,
        mfaCode: codeAt(secret, Date.now()),
      });

      expect(result.mfaEnrolmentRequired).toBe(false);
    });

    it('leaves an unprivileged user unflagged', async () => {
      const user = users.add(makeUser({ email: 'viewer@example.com', passwordHash }));
      members.rows.push({ userId: user.id, role: 'viewer' } as OrganizationMember);

      const result = await auth.login({ email: 'viewer@example.com', password: PASSWORD });

      expect(result.mfaEnrolmentRequired).toBe(false);
    });
  });
});
