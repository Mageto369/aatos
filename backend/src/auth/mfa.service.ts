import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { authenticator } from 'otplib';
import { randomInt } from 'crypto';
import { User } from './entities/user.entity';
import { MfaRecoveryCode } from './entities/mfa-recovery-code.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { MfaCryptoService } from './services/mfa-crypto.service';

/**
 * Organization roles that may not operate without a second factor.
 *
 * These are the roles that can move money, approve compliance decisions, or
 * change who else holds a role — i.e. the ones where a stolen password is not
 * a contained incident.
 */
export const MFA_REQUIRED_ROLES: readonly string[] = [
  'owner',
  'admin',
  'platform_admin',
  'compliance_officer',
  'finance_officer',
];

/** TOTP parameters. These are the values encoded into the otpauth:// URI. */
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

/**
 * Accepted clock drift, in steps, either side of now. One step (±30s) is the
 * usual compromise: it absorbs the phone/server skew that real devices have
 * without widening the guessing surface much. Every extra window multiplies
 * the number of codes that are simultaneously valid, and replay protection
 * (see verifyUserToken) is what keeps that window from being reusable.
 */
const TOTP_DRIFT_WINDOW = 1;

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;
/** Crockford-style alphabet: no I, L, O, U, 0 or 1 to mis-transcribe. */
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

export interface MfaEnrolmentChallenge {
  /** Base32 secret. Shown once, during enrolment, for manual entry. */
  secret: string;
  /** otpauth:// URI the client renders as a QR code. */
  otpauthUrl: string;
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
}

export interface MfaStatus {
  enabled: boolean;
  required: boolean;
  enrolmentPending: boolean;
  enrolledAt: Date | null;
  recoveryCodesRemaining: number;
}

/**
 * MFA service.
 *
 * Real TOTP (RFC 6238) via otplib. There is no environment in which a fixed
 * code is accepted: verification is the same code path in test, development
 * and production, and the only inputs it trusts are the user's stored secret
 * and the current clock.
 *
 * Secrets are encrypted at rest (see MfaCryptoService) and are returned to the
 * caller exactly once — in the enrolment challenge, before the secret can
 * authenticate anything. Once enrolment is confirmed, no method on this class
 * returns or logs a secret.
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly issuer: string;

  /**
   * A private otplib instance rather than the shared `authenticator` export:
   * the exported singleton carries mutable global options, so anything else in
   * the process that set `authenticator.options` would silently change how
   * this service verifies codes.
   *
   * clone(), not create(): create() returns a bare instance that has lost the
   * preset's crypto and base32 plugins, and every call then fails with
   * "Expecting options.keyDecoder to be a function".
   */
  private readonly totp = authenticator.clone({
    step: TOTP_STEP_SECONDS,
    digits: TOTP_DIGITS,
    window: [TOTP_DRIFT_WINDOW, TOTP_DRIFT_WINDOW],
  });

  constructor(
    private readonly config: ConfigService,
    private readonly crypto: MfaCryptoService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MfaRecoveryCode)
    private readonly recoveryRepo: Repository<MfaRecoveryCode>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {
    this.issuer = this.config.get<string>('MFA_ISSUER', 'AATOS');
  }

  // ---------------------------------------------------------------------
  // Primitives
  // ---------------------------------------------------------------------

  /** A fresh base32 TOTP secret (160 bits, as RFC 4226 recommends). */
  generateSecret(): string {
    return this.totp.generateSecret(20);
  }

  /** The otpauth:// URI a client turns into a QR code. */
  buildOtpauthUrl(accountName: string, secret: string): string {
    return this.totp.keyuri(accountName, this.issuer, secret);
  }

  /**
   * Verify a code against a plaintext base32 secret.
   *
   * Returns the TOTP counter the code belongs to, or null if it matches no
   * step inside the drift window. The counter is what makes replay detection
   * possible; callers that hold user state should prefer verifyUserToken.
   */
  checkTokenCounter(token: string, secret: string): number | null {
    const normalised = (token ?? '').replace(/\D/g, '');
    if (normalised.length !== TOTP_DIGITS || !secret) {
      return null;
    }

    let delta: number | null;
    try {
      delta = this.totp.checkDelta(normalised, secret);
    } catch {
      // A malformed secret must not authenticate anything.
      return null;
    }

    if (delta === null || delta === undefined) {
      return null;
    }

    return Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS) + delta;
  }

  /**
   * Verify a code against a plaintext base32 secret.
   *
   * Kept as the low-level boolean form used by callers that already hold the
   * secret. It has no environment-specific behaviour and no fixed-code
   * shortcut of any kind.
   */
  async verifyToken(token: string, secret: string): Promise<boolean> {
    return this.checkTokenCounter(token, secret) !== null;
  }

  /** Whether a role may not operate without a second factor. */
  isMfaRequired(role: string | null | undefined): boolean {
    return !!role && MFA_REQUIRED_ROLES.includes(role);
  }

  /**
   * All roles this user holds, across every organization they belong to.
   * Enforcement has to consider every membership: a user whose primary
   * organization makes them a `viewer` but who is an `owner` elsewhere is
   * still privileged.
   */
  async rolesForUser(userId: string): Promise<string[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return memberships.map((m) => m.role);
  }

  /** True when this user holds a privileged role but has not enrolled yet. */
  async isEnrolmentRequiredForUser(user: Pick<User, 'id' | 'mfaEnabled'>): Promise<boolean> {
    if (user.mfaEnabled) {
      return false;
    }
    const roles = await this.rolesForUser(user.id);
    return roles.some((role) => this.isMfaRequired(role));
  }

  // ---------------------------------------------------------------------
  // Enrolment
  // ---------------------------------------------------------------------

  /**
   * Start enrolment: mint a secret, park it as *pending*, and hand back the
   * otpauth:// URI.
   *
   * The secret is not promoted to `mfaSecret` and `mfaEnabled` stays false
   * until the user proves possession in confirmEnrolment. That ordering is
   * what stops a half-finished enrolment from locking someone out, and it
   * means re-enrolling does not invalidate the authenticator that currently
   * works.
   */
  async beginEnrolment(userId: string): Promise<MfaEnrolmentChallenge> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = this.generateSecret();
    user.mfaPendingSecret = this.crypto.encryptSecret(secret);
    await this.userRepo.save(user);

    this.logger.log(`MFA enrolment started for user ${user.id}`);

    return {
      secret,
      otpauthUrl: this.buildOtpauthUrl(user.email, secret),
      issuer: this.issuer,
      algorithm: 'SHA1',
      digits: TOTP_DIGITS,
      period: TOTP_STEP_SECONDS,
    };
  }

  /**
   * Finish enrolment by presenting a code from the pending secret. Returns the
   * recovery codes — the only time they exist in plaintext.
   */
  async confirmEnrolment(userId: string, token: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.mfaPendingSecret) {
      throw new BadRequestException(
        'No MFA enrolment in progress. Start one with POST /auth/mfa/enroll.',
      );
    }

    const secret = this.decryptOrFail(user.mfaPendingSecret, user.id);
    const counter = this.checkTokenCounter(token, secret);
    if (counter === null) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    user.mfaSecret = user.mfaPendingSecret;
    user.mfaPendingSecret = null;
    user.mfaEnabled = true;
    user.mfaEnrolledAt = new Date();
    // Burn the confirming code so it cannot also be used to log in.
    user.mfaLastVerifiedCounter = String(counter);
    user.mfaRecoveryCodesIssuedAt = new Date();
    await this.userRepo.save(user);

    const recoveryCodes = await this.replaceRecoveryCodes(user.id);

    this.logger.log(`MFA enrolment confirmed for user ${user.id}`);
    return { recoveryCodes };
  }

  /**
   * Verify a login-time code for an enrolled user.
   *
   * Beyond the TOTP check this refuses any counter at or below the last one
   * the account used. A single code is valid for its whole step plus the drift
   * window, so without this a code captured from a phishing page or a proxy
   * could be replayed for up to 90 seconds.
   */
  async verifyUserToken(user: User, token: string): Promise<boolean> {
    if (!user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    const secret = this.decryptOrFail(user.mfaSecret, user.id);
    const counter = this.checkTokenCounter(token, secret);
    if (counter === null) {
      return false;
    }

    const last =
      user.mfaLastVerifiedCounter === null || user.mfaLastVerifiedCounter === undefined
        ? null
        : Number(user.mfaLastVerifiedCounter);

    if (last !== null && Number.isFinite(last) && counter <= last) {
      this.logger.warn(`Replayed MFA code rejected for user ${user.id}`);
      return false;
    }

    user.mfaLastVerifiedCounter = String(counter);
    await this.userRepo.update({ id: user.id }, { mfaLastVerifiedCounter: String(counter) });
    return true;
  }

  /**
   * Spend a recovery code. Returns true exactly once per code: the claim is a
   * conditional UPDATE, so a code that two requests submit at the same moment
   * is granted to one of them.
   */
  async consumeRecoveryCode(user: Pick<User, 'id' | 'mfaEnabled'>, code: string): Promise<boolean> {
    if (!user.mfaEnabled) {
      return false;
    }

    const normalised = MfaCryptoService.normaliseRecoveryCode(code);
    if (normalised.length !== RECOVERY_CODE_LENGTH) {
      return false;
    }

    const result = await this.recoveryRepo.update(
      { userId: user.id, codeHash: this.crypto.hashRecoveryCode(normalised), usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const claimed = (result.affected ?? 0) > 0;
    if (claimed) {
      this.logger.warn(`Recovery code used for user ${user.id}`);
    }
    return claimed;
  }

  /** How many unused recovery codes remain. */
  async countUnusedRecoveryCodes(userId: string): Promise<number> {
    return this.recoveryRepo.count({ where: { userId, usedAt: IsNull() } });
  }

  /**
   * Issue a fresh set of recovery codes, invalidating the previous set.
   * Requires a current TOTP code: otherwise a hijacked session could quietly
   * mint itself a permanent bypass of the second factor.
   */
  async regenerateRecoveryCodes(userId: string, token: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.requireEnrolledUser(userId);

    if (!(await this.verifyUserToken(user, token))) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    const recoveryCodes = await this.replaceRecoveryCodes(user.id);
    await this.userRepo.update({ id: user.id }, { mfaRecoveryCodesIssuedAt: new Date() });
    return { recoveryCodes };
  }

  /**
   * Turn MFA off. Refused for privileged roles — for those, enrolment is a
   * condition of holding the role, so the way out is to give up the role.
   */
  async disableMfa(userId: string, token: string): Promise<void> {
    const user = await this.requireEnrolledUser(userId);

    if (await this.isEnrolmentRequiredForUserRoles(user.id)) {
      throw new ForbiddenException(
        'Multi-factor authentication cannot be disabled for a privileged role. ' +
          'Have the role removed first.',
      );
    }

    if (!(await this.verifyUserToken(user, token))) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    await this.userRepo.update(
      { id: user.id },
      {
        mfaEnabled: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaEnrolledAt: null,
        mfaLastVerifiedCounter: null,
        mfaRecoveryCodesIssuedAt: null,
      },
    );
    await this.recoveryRepo.delete({ userId: user.id });

    this.logger.warn(`MFA disabled for user ${user.id}`);
  }

  async getStatus(userId: string): Promise<MfaStatus> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      enabled: user.mfaEnabled,
      required: await this.isEnrolmentRequiredForUserRoles(user.id),
      enrolmentPending: !user.mfaEnabled && !!user.mfaPendingSecret,
      enrolledAt: user.mfaEnrolledAt ?? null,
      recoveryCodesRemaining: user.mfaEnabled
        ? await this.countUnusedRecoveryCodes(user.id)
        : 0,
    };
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private async isEnrolmentRequiredForUserRoles(userId: string): Promise<boolean> {
    const roles = await this.rolesForUser(userId);
    return roles.some((role) => this.isMfaRequired(role));
  }

  private async requireEnrolledUser(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('Multi-factor authentication is not enabled for this account');
    }
    return user;
  }

  private decryptOrFail(stored: string, userId: string): string {
    try {
      return this.crypto.decryptSecret(stored);
    } catch {
      // Falling back to "no second factor" here would turn a key-rotation
      // mistake into a silent security downgrade, so this fails the request.
      this.logger.error(`Stored MFA secret for user ${userId} could not be decrypted`);
      throw new InternalServerErrorException(
        'Stored multi-factor secret could not be read. Contact support to re-enrol.',
      );
    }
  }

  private async replaceRecoveryCodes(userId: string): Promise<string[]> {
    const codes = new Set<string>();
    while (codes.size < RECOVERY_CODE_COUNT) {
      codes.add(this.generateRecoveryCode());
    }

    const plain = Array.from(codes);
    await this.recoveryRepo.delete({ userId });
    await this.recoveryRepo.insert(
      plain.map((code) => ({
        userId,
        codeHash: this.crypto.hashRecoveryCode(code),
        usedAt: null,
      })),
    );

    // Presentation only — the stored form is the hash of the letters alone.
    return plain.map((code) => `${code.slice(0, 5)}-${code.slice(5)}`);
  }

  private generateRecoveryCode(): string {
    let code = '';
    for (let i = 0; i < RECOVERY_CODE_LENGTH; i++) {
      code += RECOVERY_CODE_ALPHABET.charAt(randomInt(RECOVERY_CODE_ALPHABET.length));
    }
    return code;
  }
}
