import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { MfaService } from './mfa.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private authService: AuthService,
    @InjectRepository(OrganizationMember)
    private memberRepo: Repository<OrganizationMember>,
    private mfaService: MfaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
      issuer: 'aatos-api',
      audience: 'aatos-client',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      return null;
    }
    // Every membership, not just the primary one: enrolment is required if the
    // user is privileged *anywhere*. Fetching the full list costs the same
    // query the primary lookup already made.
    const members = await this.memberRepo.find({
      where: { userId: user.id },
      order: { createdAt: 'ASC' },
    });
    const member = members[0];

    // Derived from live rows rather than carried in the token, so enrolling
    // unblocks tokens that were issued before enrolment, and a token cannot
    // assert that the requirement is already satisfied.
    const mfaEnrolmentRequired =
      !user.mfaEnabled && members.some((m) => this.mfaService.isMfaRequired(m.role));

    return {
      userId: user.id,
      email: user.email,
      orgId: member?.organizationId || null,
      role: member?.role || null,
      mfaEnabled: user.mfaEnabled,
      mfaEnrolmentRequired,
    };
  }
}
