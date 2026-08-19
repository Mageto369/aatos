import { IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** A six-digit TOTP code from the user's authenticator app. */
export class MfaCodeDto {
  @ApiProperty({ example: '482913', description: 'Six-digit code from the authenticator app' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be six digits' })
  code: string;
}

/** A single recovery code, with or without its display dash. */
export class MfaRecoveryCodeDto {
  @ApiProperty({ example: 'H4K7Q-2MXPT' })
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9-]+$/, { message: 'recoveryCode contains unexpected characters' })
  recoveryCode: string;
}

export interface MfaEnrolmentResponse {
  /**
   * Base32 secret for manual entry. Present only in the enrolment challenge,
   * before this secret can authenticate anything; no later response repeats it.
   */
  secret: string;
  otpauthUrl: string;
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
}

export interface MfaRecoveryCodesResponse {
  recoveryCodes: string[];
  /** Recovery codes are shown once. Losing them means re-enrolling. */
  notice: string;
}
