import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { MfaService } from '../mfa.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let _jwtService: jest.Mocked<JwtService>;

  const mockUser = (): User =>
    ({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      firstName: 'Test',
      lastName: 'User',
      status: 'active',
      mfaEnabled: false,
      failedLoginCount: 0,
      lockedUntil: null,
      loginCount: 0,
      lastLoginAt: null,
    } as User);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            createToken: jest.fn(),
          },
        },
        {
          // These cases cover accounts without MFA. The second factor has its
          // own suites in mfa.service.spec.ts and auth-mfa-login.spec.ts.
          provide: MfaService,
          useValue: {
            isEnrolmentRequiredForUser: jest.fn().mockResolvedValue(false),
            verifyUserToken: jest.fn().mockResolvedValue(false),
            consumeRecoveryCode: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    _jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should create a user when email is unique', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ ...dto, id: 'user-2' } as unknown as User);
      userRepo.save.mockResolvedValue({ ...dto, id: 'user-2', passwordHash: 'hashed' } as unknown as User);

      const result = await service.register(dto);

      expect(result.user.email).toBe(dto.email.toLowerCase());
      expect(result.accessToken).toBe('mock-jwt');
    });

    it('should throw ConflictException when email exists', async () => {
      const dto = { email: 'test@example.com', password: 'password123', firstName: 'Test', lastName: 'User' };
      userRepo.findOne.mockResolvedValue(mockUser());

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const user = mockUser();
      user.passwordHash = await bcrypt.hash(dto.password, 12);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('mock-jwt');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const dto = { email: 'test@example.com', password: 'wrongpassword' };
      const user = mockUser();
      user.passwordHash = await bcrypt.hash('password123', 12);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      const dto = { email: 'unknown@example.com', password: 'password123' };
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user by id', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());

      const result = await service.validateUser('user-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('user-1');
    });
  });
});
