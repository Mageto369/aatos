import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private authService: AuthService,
    @InjectRepository(OrganizationMember)
    private memberRepo: Repository<OrganizationMember>,
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
    // Look up primary organization
    const member = await this.memberRepo.findOne({
      where: { userId: user.id,  },
      order: { createdAt: 'ASC' },
    });
    return { userId: user.id, email: user.email, orgId: member?.organizationId || null };
  }
}
