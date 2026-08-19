import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export * from './mfa.dto';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '+254712345678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  /**
   * Required when the account has MFA enabled. Omitting it returns 401 with
   * code `mfa_required` so the client knows to prompt rather than to treat the
   * password as wrong.
   */
  @ApiProperty({ example: '482913', required: false, description: 'Six-digit TOTP code' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'mfaCode must be six digits' })
  mfaCode?: string;

  /** Alternative to mfaCode when the authenticator is unavailable. */
  @ApiProperty({ example: 'H4K7Q-2MXPT', required: false, description: 'Single-use recovery code' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9-]+$/, { message: 'recoveryCode contains unexpected characters' })
  recoveryCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    status: string;
    mfaEnabled: boolean;
  };
  /**
   * True when the caller holds a privileged role but has not enrolled. The
   * access token is issued, but MfaEnrolmentGuard rejects everything except
   * the enrolment endpoints until enrolment completes.
   */
  mfaEnrolmentRequired: boolean;
}
