import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto, AuthResponse } from './dto';
import { RefreshTokenService } from './services/refresh-token.service';

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

  async login(dto: LoginDto): Promise<FullAuthResponse> {
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    user.lastLoginAt = new Date();
    user.loginCount += 1;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    await this.userRepo.save(user);

    return this.buildFullAuthResponse(user);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId,  } });
  }

  private buildFullAuthResponse(user: User): FullAuthResponse {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    
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
      },
      refreshToken: '', // populated by controller
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }
}
