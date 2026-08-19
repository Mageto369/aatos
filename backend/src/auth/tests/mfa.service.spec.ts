import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { MfaService } from '../mfa.service';
import { MfaCryptoService } from '../services/mfa-crypto.service';
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

/** Fixed point in time so every code in these tests is reproducible. */
const NOW = new Date('2026-03-04T10:15:30.000Z').getTime();
const STEP_MS = 30_000;

/**
 * An independent otplib instance, used only to *produce* codes the way a real
 * authenticator app would. The service under test never sees it.
 */
function codeAt(secret: string, epochMs: number): string {
  return authenticator.clone({ step: 30, digits: 6, epoch: epochMs }).generate(secret);
}

describe('MfaService', () => {
  let service: MfaService;
  let crypto: MfaCryptoService;
  let users: FakeUserRepository;
  let recoveryCodes: FakeRecoveryCodeRepository;
  let members: FakeMemberRepository;

  beforeEach(async () => {
    jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });

    users = new FakeUserRepository();
    recoveryCodes = new FakeRecoveryCodeRepository();
    members = new FakeMemberRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        MfaCryptoService,
        { provide: ConfigService, useValue: fakeConfigService() },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(MfaRecoveryCode), useValue: recoveryCodes },
        { provide: getRepositoryToken(OrganizationMember), useValue: members },
      ],
    }).compile();

    service = module.get(MfaService);
    crypto = module.get(MfaCryptoService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Enrol a user and return them plus their plaintext secret. */
  async function enrol(): Promise<{ user: User; secret: string }> {
    const user = users.add(makeUser());
    const challenge = await service.beginEnrolment(user.id);
    await service.confirmEnrolment(user.id, codeAt(challenge.secret, Date.now()));
    return { user, secret: challenge.secret };
  }

  describe('token verification', () => {
    it('accepts the code the authenticator is generating right now', async () => {
      const secret = service.generateSecret();

      await expect(service.verifyToken(codeAt(secret, NOW), secret)).resolves.toBe(true);
    });

    it('rejects a wrong code', async () => {
      const secret = service.generateSecret();
      const valid = codeAt(secret, NOW);
      // Perturb one digit so the code is well-formed but wrong.
      const wrong = String((Number(valid) + 1) % 1_000_000).padStart(6, '0');

      expect(wrong).not.toBe(valid);
      await expect(service.verifyToken(wrong, secret)).resolves.toBe(false);
    });

    it('rejects a code generated with a different secret', async () => {
      const secret = service.generateSecret();
      const otherSecret = service.generateSecret();

      await expect(service.verifyToken(codeAt(otherSecret, NOW), secret)).resolves.toBe(false);
    });

    it('accepts one step of clock drift in either direction', async () => {
      const secret = service.generateSecret();

      await expect(service.verifyToken(codeAt(secret, NOW - STEP_MS), secret)).resolves.toBe(true);
      await expect(service.verifyToken(codeAt(secret, NOW + STEP_MS), secret)).resolves.toBe(true);
    });

    it('rejects a code from outside the drift window', async () => {
      const secret = service.generateSecret();

      // Two steps out is already outside a ±1 window; five steps is an hour
      // of skew or a code that has been sitting in a phishing kit.
      await expect(service.verifyToken(codeAt(secret, NOW - 2 * STEP_MS), secret)).resolves.toBe(
        false,
      );
      await expect(service.verifyToken(codeAt(secret, NOW + 2 * STEP_MS), secret)).resolves.toBe(
        false,
      );
      await expect(service.verifyToken(codeAt(secret, NOW - 5 * STEP_MS), secret)).resolves.toBe(
        false,
      );
    });

    it('rejects malformed input instead of throwing', async () => {
      const secret = service.generateSecret();

      await expect(service.verifyToken('', secret)).resolves.toBe(false);
      await expect(service.verifyToken('12345', secret)).resolves.toBe(false);
      await expect(service.verifyToken('abcdef', secret)).resolves.toBe(false);
      await expect(service.verifyToken('482913', 'not-a-base32-secret!!')).resolves.toBe(false);
    });
  });

  describe('the simulation backdoors are gone', () => {
    // The service this replaced returned true for '000000' when NODE_ENV was
    // 'development' and for '123456' in every environment. fakeConfigService
    // reports NODE_ENV=development, so if either shortcut survived in any
    // form, these would pass through.
    it.each(['000000', '123456'])('rejects the former backdoor code %s', async (backdoor) => {
      const secret = service.generateSecret();

      // Guard against the one-in-a-million case where the genuine current
      // code happens to equal the backdoor.
      expect(codeAt(secret, NOW)).not.toBe(backdoor);

      await expect(service.verifyToken(backdoor, secret)).resolves.toBe(false);
    });

    it('rejects the backdoor codes for an enrolled user at login', async () => {
      const { user, secret } = await enrol();

      expect(codeAt(secret, Date.now())).not.toBe('000000');
      expect(codeAt(secret, Date.now())).not.toBe('123456');

      await expect(service.verifyUserToken(user, '000000')).resolves.toBe(false);
      await expect(service.verifyUserToken(user, '123456')).resolves.toBe(false);
    });

    it('rejects the backdoor codes as recovery codes', async () => {
      const { user } = await enrol();

      await expect(service.consumeRecoveryCode(user, '000000')).resolves.toBe(false);
      await expect(service.consumeRecoveryCode(user, '123456')).resolves.toBe(false);
    });
  });

  describe('enrolment', () => {
    it('hands back an otpauth URI that carries the secret and issuer', async () => {
      const user = users.add(makeUser());

      const challenge = await service.beginEnrolment(user.id);

      expect(challenge.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
      expect(challenge.otpauthUrl).toContain(`secret=${challenge.secret}`);
      expect(challenge.otpauthUrl).toContain('issuer=AATOS');
      expect(challenge.digits).toBe(6);
      expect(challenge.period).toBe(30);
    });

    it('does not enable MFA until a code proves the secret', async () => {
      const user = users.add(makeUser());

      await service.beginEnrolment(user.id);

      expect(user.mfaEnabled).toBe(false);
      expect(user.mfaSecret).toBeNull();
      expect(user.mfaPendingSecret).not.toBeNull();
    });

    it('stores the secret encrypted, never in plaintext', async () => {
      const user = users.add(makeUser());

      const challenge = await service.beginEnrolment(user.id);

      expect(user.mfaPendingSecret).not.toContain(challenge.secret);
      expect(crypto.decryptSecret(user.mfaPendingSecret as string)).toBe(challenge.secret);

      await service.confirmEnrolment(user.id, codeAt(challenge.secret, Date.now()));
      expect(user.mfaSecret).not.toContain(challenge.secret);
      expect(crypto.decryptSecret(user.mfaSecret as string)).toBe(challenge.secret);
    });

    it('refuses to confirm with a wrong code and leaves MFA off', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);
      const wrong = String((Number(codeAt(challenge.secret, NOW)) + 7) % 1_000_000).padStart(6, '0');

      await expect(service.confirmEnrolment(user.id, wrong)).rejects.toThrow(UnauthorizedException);
      expect(user.mfaEnabled).toBe(false);
      expect(user.mfaSecret).toBeNull();
    });

    it('refuses to confirm when no enrolment was started', async () => {
      const user = users.add(makeUser());

      await expect(service.confirmEnrolment(user.id, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('does not disturb a working secret while a re-enrolment is pending', async () => {
      const { user, secret } = await enrol();
      const enrolledSecret = user.mfaSecret;

      await service.beginEnrolment(user.id);

      expect(user.mfaSecret).toBe(enrolledSecret);
      expect(user.mfaEnabled).toBe(true);
      // The old authenticator still works.
      jest.setSystemTime(NOW + STEP_MS);
      await expect(service.verifyUserToken(user, codeAt(secret, Date.now()))).resolves.toBe(true);
    });
  });

  describe('replay protection', () => {
    it('accepts a code once and refuses the same code again', async () => {
      const { user, secret } = await enrol();

      jest.setSystemTime(NOW + STEP_MS);
      const code = codeAt(secret, Date.now());

      await expect(service.verifyUserToken(user, code)).resolves.toBe(true);
      await expect(service.verifyUserToken(user, code)).resolves.toBe(false);
    });

    it('accepts the next step after a code has been spent', async () => {
      const { user, secret } = await enrol();

      jest.setSystemTime(NOW + STEP_MS);
      await expect(service.verifyUserToken(user, codeAt(secret, Date.now()))).resolves.toBe(true);

      jest.setSystemTime(NOW + 2 * STEP_MS);
      await expect(service.verifyUserToken(user, codeAt(secret, Date.now()))).resolves.toBe(true);
    });

    it('refuses to verify for a user who is not enrolled', async () => {
      const user = users.add(makeUser());

      await expect(service.verifyUserToken(user, '123456')).resolves.toBe(false);
    });
  });

  describe('recovery codes', () => {
    it('issues ten codes and stores only their hashes', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);

      const { recoveryCodes: issued } = await service.confirmEnrolment(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );

      expect(issued).toHaveLength(10);
      expect(new Set(issued).size).toBe(10);
      expect(recoveryCodes.rows).toHaveLength(10);
      for (const stored of recoveryCodes.rows) {
        expect(stored.codeHash).toMatch(/^[0-9a-f]{64}$/);
        expect(issued.some((code) => stored.codeHash.includes(code))).toBe(false);
      }
    });

    it('accepts a recovery code once and never again', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);
      const { recoveryCodes: issued } = await service.confirmEnrolment(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );
      const code = issued[0];

      await expect(service.consumeRecoveryCode(user, code)).resolves.toBe(true);
      await expect(service.consumeRecoveryCode(user, code)).resolves.toBe(false);
      await expect(service.consumeRecoveryCode(user, code)).resolves.toBe(false);
    });

    it('leaves the other codes usable after one is spent', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);
      const { recoveryCodes: issued } = await service.confirmEnrolment(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );

      await expect(service.consumeRecoveryCode(user, issued[0])).resolves.toBe(true);
      await expect(service.countUnusedRecoveryCodes(user.id)).resolves.toBe(9);
      await expect(service.consumeRecoveryCode(user, issued[1])).resolves.toBe(true);
      await expect(service.countUnusedRecoveryCodes(user.id)).resolves.toBe(8);
    });

    it('ignores the display formatting of a code', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);
      const { recoveryCodes: issued } = await service.confirmEnrolment(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );

      // Same code, typed without the dash and in lower case.
      await expect(
        service.consumeRecoveryCode(user, issued[0].replace('-', '').toLowerCase()),
      ).resolves.toBe(true);
      await expect(service.consumeRecoveryCode(user, issued[0])).resolves.toBe(false);
    });

    it('rejects a code that was never issued', async () => {
      const { user } = await enrol();

      await expect(service.consumeRecoveryCode(user, 'AAAAA-AAAAA')).resolves.toBe(false);
    });

    it('rejects any recovery code once MFA is off', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);
      const { recoveryCodes: issued } = await service.confirmEnrolment(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );

      user.mfaEnabled = false;
      await expect(service.consumeRecoveryCode(user, issued[0])).resolves.toBe(false);
    });

    it('replaces the whole set when regenerated, invalidating the old codes', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);
      const { recoveryCodes: first } = await service.confirmEnrolment(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );

      jest.setSystemTime(NOW + STEP_MS);
      const { recoveryCodes: second } = await service.regenerateRecoveryCodes(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );

      expect(second).toHaveLength(10);
      expect(second).not.toEqual(expect.arrayContaining(first));
      await expect(service.consumeRecoveryCode(user, first[0])).resolves.toBe(false);
      await expect(service.consumeRecoveryCode(user, second[0])).resolves.toBe(true);
    });

    it('will not regenerate without a valid current code', async () => {
      const { user } = await enrol();

      await expect(service.regenerateRecoveryCodes(user.id, '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('privileged role enforcement', () => {
    it.each(['owner', 'admin', 'platform_admin', 'compliance_officer', 'finance_officer'])(
      'requires MFA for the %s role',
      (role) => {
        expect(service.isMfaRequired(role)).toBe(true);
      },
    );

    it.each(['viewer', 'operator', 'agent', 'support', null, undefined, ''])(
      'does not require MFA for %s',
      (role) => {
        expect(service.isMfaRequired(role as string | null)).toBe(false);
      },
    );

    it('flags enrolment as required for a privileged member who has not enrolled', async () => {
      const user = users.add(makeUser());
      members.rows.push({ userId: user.id, role: 'admin' } as OrganizationMember);

      await expect(service.isEnrolmentRequiredForUser(user)).resolves.toBe(true);
    });

    it('considers privilege in any organization, not just the primary one', async () => {
      const user = users.add(makeUser());
      members.rows.push({ userId: user.id, role: 'viewer' } as OrganizationMember);
      members.rows.push({ userId: user.id, role: 'compliance_officer' } as OrganizationMember);

      await expect(service.isEnrolmentRequiredForUser(user)).resolves.toBe(true);
    });

    it('clears the requirement once the user is enrolled', async () => {
      const { user } = await enrol();
      members.rows.push({ userId: user.id, role: 'owner' } as OrganizationMember);

      await expect(service.isEnrolmentRequiredForUser(user)).resolves.toBe(false);
    });

    it('does not require enrolment for an unprivileged member', async () => {
      const user = users.add(makeUser());
      members.rows.push({ userId: user.id, role: 'viewer' } as OrganizationMember);

      await expect(service.isEnrolmentRequiredForUser(user)).resolves.toBe(false);
    });

    it('refuses to let a privileged user turn MFA off', async () => {
      const { user, secret } = await enrol();
      members.rows.push({ userId: user.id, role: 'owner' } as OrganizationMember);

      jest.setSystemTime(NOW + STEP_MS);
      await expect(
        service.disableMfa(user.id, codeAt(secret, Date.now())),
      ).rejects.toThrow(ForbiddenException);
      expect(user.mfaEnabled).toBe(true);
    });

    it('lets an unprivileged user turn MFA off with a valid code', async () => {
      const { user, secret } = await enrol();
      members.rows.push({ userId: user.id, role: 'viewer' } as OrganizationMember);

      jest.setSystemTime(NOW + STEP_MS);
      await service.disableMfa(user.id, codeAt(secret, Date.now()));

      expect(user.mfaEnabled).toBe(false);
      expect(user.mfaSecret).toBeNull();
      expect(recoveryCodes.rows).toHaveLength(0);
    });

    it('will not turn MFA off without a valid code', async () => {
      const { user } = await enrol();
      members.rows.push({ userId: user.id, role: 'viewer' } as OrganizationMember);

      await expect(service.disableMfa(user.id, '000000')).rejects.toThrow(UnauthorizedException);
      expect(user.mfaEnabled).toBe(true);
    });
  });

  describe('status', () => {
    it('reports the enrolled state and remaining recovery codes', async () => {
      const user = users.add(makeUser());
      const challenge = await service.beginEnrolment(user.id);

      let status = await service.getStatus(user.id);
      expect(status).toMatchObject({ enabled: false, enrolmentPending: true, required: false });

      const { recoveryCodes: issued } = await service.confirmEnrolment(
        user.id,
        codeAt(challenge.secret, Date.now()),
      );
      await service.consumeRecoveryCode(user, issued[0]);

      status = await service.getStatus(user.id);
      expect(status.enabled).toBe(true);
      expect(status.enrolmentPending).toBe(false);
      expect(status.recoveryCodesRemaining).toBe(9);
      expect(status.enrolledAt).toBeInstanceOf(Date);
    });

    it('never exposes a secret', async () => {
      const { user } = await enrol();

      const status = await service.getStatus(user.id);

      expect(JSON.stringify(status)).not.toContain(user.mfaSecret as string);
      expect(Object.keys(status)).not.toContain('secret');
    });
  });
});
