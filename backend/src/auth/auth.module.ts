import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshController } from './refresh.controller';
import { JwtStrategy } from './jwt.strategy';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { MfaCryptoService } from './services/mfa-crypto.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { MfaRecoveryCode } from './entities/mfa-recovery-code.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MfaEnrolmentGuard } from './guards/mfa-enrolment.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OrganizationMember, RefreshToken, MfaRecoveryCode]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h'),
          issuer: 'aatos-api',
          audience: 'aatos-client',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    MfaCryptoService,
    MfaService,
    RefreshTokenService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Order matters: global guards run in registration order, and this one
    // reads req.user, which JwtAuthGuard above is what populates.
    {
      provide: APP_GUARD,
      useClass: MfaEnrolmentGuard,
    },
  ],
  controllers: [AuthController, RefreshController, MfaController],
  exports: [AuthService, JwtModule, MfaService, MfaCryptoService, RefreshTokenService],
})
export class AuthModule {}
