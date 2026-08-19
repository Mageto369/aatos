import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto, AuthResponse } from './dto';
import { RefreshTokenService } from './services/refresh-token.service';
import { MfaService } from './mfa.service';

export interface FullAuthResponse extends AuthResponse {
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mfaService: MfaService,
  ) {}

  async register(dto: RegisterDto): Promise<FullAuthResponse> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: 'active',
    });

    await this.userRepo.save(user);
    return this.buildFullAuthResponse(user);
  }

  /**
   * Failed second factor. Counted against the same lockout budget as a wrong
   * password: a six-digit code has only a million values and the drift window
   * makes three of them live at once, so an attacker holding the password
   * needs the attempt limit to be real.
   */
  private async registerFailedAttempt(user: User): Promise<void> {
    user.failedLoginCount += 1;
    if (user.failedLoginCount >= 5) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
    }
    await this.userRepo.save(user);
  }

  async login(dto: LoginDto): Promise<FullAuthResponse> {
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Checked before the password, not after. The previous order let a locked
    // account log in as long as the password was right, which made the
    // attempt counter — and therefore the brute-force limit on the MFA code
    // below — decorative.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.registerFailedAttempt(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      await this.verifySecondFactor(user, dto);
    }

    user.lastLoginAt = new Date();
    user.loginCount += 1;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    await this.userRepo.save(user);

    return this.buildFullAuthResponse(user);
  }

  /**
   * Second factor for an account that has MFA enabled.
   *
   * The password being correct is not enough to get past this point: either a
   * live TOTP code or an unused recovery code has to be presented, and both
   * are verified against the user's own stored secret. There is no
   * environment, role or flag that skips it.
   */
  private async verifySecondFactor(user: User, dto: LoginDto): Promise<void> {
    if (!dto.mfaCode && !dto.recoveryCode) {
      // Distinguishable from a bad password so the client prompts for a code
      // instead of telling the user their password is wrong.
      throw new UnauthorizedException({
        code: 'mfa_required',
        message: 'Multi-factor authentication code required',
      });
    }

    const accepted = dto.recoveryCode
      ? await this.mfaService.consumeRecoveryCode(user, dto.recoveryCode)
      : await this.mfaService.verifyUserToken(user, dto.mfaCode as string);

    if (!accepted) {
      await this.registerFailedAttempt(user);
      throw new UnauthorizedException({
        code: 'mfa_invalid',
        message: dto.recoveryCode
          ? 'Invalid or already used recovery code'
          : 'Invalid multi-factor authentication code',
      });
    }
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId,  } });
  }

  private async buildFullAuthResponse(user: User): Promise<FullAuthResponse> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // A privileged user who has not enrolled still receives a token, because
    // enrolling requires one. MfaEnrolmentGuard refuses that token everywhere
    // except the enrolment routes; this flag tells the client so up front.
    const mfaEnrolmentRequired = await this.mfaService.isEnrolmentRequiredForUser(user);

    // Note: refresh token creation happens at controller level to access req.ip / req.headers['user-agent']
    // For service-level generation we return without refresh token
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: `${user.firstName} ${user.lastName}`,
        status: user.status,
        mfaEnabled: user.mfaEnabled,
      },
      mfaEnrolmentRequired,
      refreshToken: '', // populated by controller
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }
}
