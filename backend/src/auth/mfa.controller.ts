import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MfaService, MfaStatus } from './mfa.service';
import { MfaCodeDto, MfaEnrolmentResponse, MfaRecoveryCodesResponse } from './dto/mfa.dto';
import { CurrentUser, UserPayload } from './decorators/current-user.decorator';
import { AllowsPendingMfaEnrolment } from './decorators/mfa-enrolment.decorator';
import { RateLimitGuard, Throttle } from '../common/rate-limit.guard';

const RECOVERY_CODE_NOTICE =
  'Store these somewhere safe. Each code works once and they are not shown again.';

/**
 * MFA enrolment and management.
 *
 * Every route here requires a valid access token — none is @Public(). The
 * enrolment routes carry @AllowsPendingMfaEnrolment() so that a privileged
 * user who is being blocked by MfaEnrolmentGuard can still reach the endpoints
 * that resolve the block, and nothing else.
 */
@ApiTags('Auth')
@ApiBearerAuth('access-token')
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  @AllowsPendingMfaEnrolment()
  @ApiOperation({ summary: 'Report MFA state for the current user' })
  @ApiResponse({ status: 200, description: 'MFA status' })
  async status(@CurrentUser() user: UserPayload): Promise<MfaStatus> {
    return this.mfaService.getStatus(user.userId);
  }

  @Post('enroll')
  @AllowsPendingMfaEnrolment()
  @HttpCode(HttpStatus.OK)
  @Throttle('strict')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Begin TOTP enrolment and receive an otpauth:// URI' })
  @ApiResponse({ status: 200, description: 'Enrolment challenge; render otpauthUrl as a QR code' })
  async enroll(@CurrentUser() user: UserPayload): Promise<MfaEnrolmentResponse> {
    // The secret is in this response by necessity — the user has to be able to
    // type it into an authenticator that cannot scan. It is not enabled yet,
    // and no response after confirmation repeats it.
    return this.mfaService.beginEnrolment(user.userId);
  }

  @Post('enroll/confirm')
  @AllowsPendingMfaEnrolment()
  @HttpCode(HttpStatus.OK)
  @Throttle('strict')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Confirm TOTP enrolment and receive recovery codes' })
  @ApiResponse({ status: 200, description: 'MFA enabled; recovery codes returned once' })
  @ApiResponse({ status: 401, description: 'Code did not match the pending secret' })
  async confirmEnrolment(
    @CurrentUser() user: UserPayload,
    @Body() dto: MfaCodeDto,
  ): Promise<MfaRecoveryCodesResponse> {
    const { recoveryCodes } = await this.mfaService.confirmEnrolment(user.userId, dto.code);
    return { recoveryCodes, notice: RECOVERY_CODE_NOTICE };
  }

  @Post('recovery-codes')
  @HttpCode(HttpStatus.OK)
  @Throttle('strict')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Replace recovery codes (invalidates the previous set)' })
  @ApiResponse({ status: 200, description: 'New recovery codes, returned once' })
  async regenerateRecoveryCodes(
    @CurrentUser() user: UserPayload,
    @Body() dto: MfaCodeDto,
  ): Promise<MfaRecoveryCodesResponse> {
    const { recoveryCodes } = await this.mfaService.regenerateRecoveryCodes(user.userId, dto.code);
    return { recoveryCodes, notice: RECOVERY_CODE_NOTICE };
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @Throttle('strict')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Disable MFA (refused for privileged roles)' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  @ApiResponse({ status: 403, description: 'Role requires MFA' })
  async disable(
    @CurrentUser() user: UserPayload,
    @Body() dto: MfaCodeDto,
  ): Promise<{ enabled: boolean }> {
    await this.mfaService.disableMfa(user.userId, dto.code);
    return { enabled: false };
  }
}
