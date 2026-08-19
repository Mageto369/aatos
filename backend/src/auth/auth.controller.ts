import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimitGuard, Throttle } from '../common/rate-limit.guard';
import { Public } from './decorators/public.decorator';
import { AllowsPendingMfaEnrolment } from './decorators/mfa-enrolment.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('register')
  @Public()
  @Throttle('strict')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Register new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    const response = await this.authService.register(dto);
    const { token: refreshToken } = await this.refreshTokenService.createToken(
      response.user.id,
      req.ip,
      req.headers['user-agent'],
    );
    return { ...response, refreshToken };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle('strict')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Authenticate user and receive JWT' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const response = await this.authService.login(dto);
    const { token: refreshToken } = await this.refreshTokenService.createToken(
      response.user.id,
      req.ip,
      req.headers['user-agent'],
    );
    return { ...response, refreshToken };
  }

  @Get('me')
  // Readable while enrolment is outstanding: a client that has just been told
  // "403 mfa_enrolment_required" still needs to render who is signed in.
  @AllowsPendingMfaEnrolment()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async me(@Req() req: any) {
    const user = await this.authService.validateUser(req.user.userId);
    if (!user) {
      return { error: 'User not found' };
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: `${user.firstName} ${user.lastName}`,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      mfaEnrolmentRequired: req.user.mfaEnrolmentRequired === true,
    };
  }
}
