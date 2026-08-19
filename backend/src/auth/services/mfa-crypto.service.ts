import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'crypto';

const CIPHER_ALGORITHM = 'aes-256-gcm';
const CIPHER_VERSION = 'v1';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

/**
 * Key material handling for MFA.
 *
 * A TOTP secret is a bearer credential: whoever holds it can mint valid codes
 * forever. Storing it in plaintext means a read-only leak of the `users` table
 * (a backup, a log of a SELECT *, an over-broad analytics grant) hands over the
 * second factor of every account. Secrets are therefore encrypted with
 * AES-256-GCM before they touch the database, and the key lives outside it.
 *
 * Recovery codes are hashed with a keyed HMAC rather than bcrypt. That is a
 * deliberate trade:
 *
 *   - bcrypt's cost exists to slow down guessing of *low*-entropy inputs.
 *     Recovery codes here are 50 bits of server-generated randomness, so
 *     offline guessing is already infeasible; the stretching buys nothing.
 *   - a per-code salt would force a login attempt to bcrypt-compare against
 *     every one of the user's ten stored hashes — up to ~2.5s of CPU per
 *     attempt on an unauthenticated endpoint, which is a denial-of-service
 *     lever rather than a defence.
 *   - a deterministic keyed digest lets the code be claimed by a single
 *     indexed, atomic UPDATE, which is what makes "single-use" race-proof.
 *
 * The HMAC key is separate from the encryption key (both derived from the same
 * root material with different salts), so neither use can be substituted for
 * the other.
 */
@Injectable()
export class MfaCryptoService {
  private readonly encryptionKey: Buffer;
  private readonly recoveryHmacKey: Buffer;

  constructor(config: ConfigService) {
    // MFA_ENCRYPTION_KEY is the intended production input. JWT_SECRET is the
    // fallback because it is already a required, deployment-specific secret of
    // adequate length — never a hardcoded default, which would make the
    // ciphertext decryptable by anyone holding the source.
    const rootKey =
      config.get<string>('MFA_ENCRYPTION_KEY') ?? config.get<string>('JWT_SECRET') ?? '';

    if (rootKey.length < 16) {
      throw new Error(
        'MFA key material is missing or too short. Set MFA_ENCRYPTION_KEY (or JWT_SECRET) ' +
          'to at least 16 characters; MFA secrets cannot be stored safely without it.',
      );
    }

    this.encryptionKey = scryptSync(rootKey, 'aatos.mfa.secret.v1', 32);
    this.recoveryHmacKey = scryptSync(rootKey, 'aatos.mfa.recovery.v1', 32);
  }

  /**
   * Encrypt a base32 TOTP secret for storage.
   * Format: v1.<iv>.<authTag>.<ciphertext>, each part base64url.
   */
  encryptSecret(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(CIPHER_ALGORITHM, this.encryptionKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      CIPHER_VERSION,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  }

  /**
   * Decrypt a stored TOTP secret. Throws if the value was not produced by
   * encryptSecret with the same key — a tampered or key-rotated ciphertext
   * must fail loudly rather than degrade into "no second factor".
   */
  decryptSecret(stored: string): string {
    const parts = stored.split('.');
    if (parts.length !== 4 || parts[0] !== CIPHER_VERSION) {
      throw new Error('Stored MFA secret is not in the expected encrypted format');
    }

    const iv = Buffer.from(parts[1], 'base64url');
    const authTag = Buffer.from(parts[2], 'base64url');
    const ciphertext = Buffer.from(parts[3], 'base64url');

    if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
      throw new Error('Stored MFA secret has a malformed envelope');
    }

    const decipher = createDecipheriv(CIPHER_ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  /**
   * Keyed digest of a recovery code. Input is normalised first so that the
   * formatting a user copies (dashes, spaces, lower case) does not change the
   * digest.
   */
  hashRecoveryCode(code: string): string {
    return createHmac('sha256', this.recoveryHmacKey)
      .update(MfaCryptoService.normaliseRecoveryCode(code))
      .digest('hex');
  }

  static normaliseRecoveryCode(code: string): string {
    return (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}
