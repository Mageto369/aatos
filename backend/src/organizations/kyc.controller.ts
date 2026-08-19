import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { KycService } from './kyc.service';

/**
 * KYC routes take the organization from the URL path. Without a check, any
 * authenticated user could submit verification documents for — or read the
 * verification state of — an organization they have nothing to do with.
 * Platform admins are exempt so they can service any tenant.
 */
function assertActsFor(req: any, orgId: string): void {
  if (req.user?.role === 'platform_admin' || req.user?.role === 'admin') return;
  if (req.user?.orgId !== orgId) {
    throw new ForbiddenException('You do not have access to this organization');
  }
}

@ApiTags('KYC / Verification')
@Controller('kyc')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit/:orgId')
  @ApiOperation({ summary: 'Submit KYC documents for verification' })
  async submitDocuments(
    @Param('orgId') orgId: string,
    @Body() body: { documents: Array<{ type: 'business_registration' | 'tax_certificate' | 'bank_statement' | 'identity_document' | 'physical_site_proof' | 'trade_reference'; documentUrl: string }> },
    @Request() req: any,
  ) {
    assertActsFor(req, orgId);
    return this.kycService.submitDocuments(orgId, body.documents);
  }

  @Get('status/:orgId')
  @ApiOperation({ summary: 'Get KYC submission status' })
  async getStatus(@Param('orgId') orgId: string, @Request() req: any) {
    assertActsFor(req, orgId);
    return this.kycService.getSubmission(orgId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'List organizations pending verification (admin only)' })
  @Roles('platform_admin', 'admin')
  async getPendingReview() {
    return this.kycService.getPendingReview();
  }

  @Post('review/:orgId')
  @ApiOperation({ summary: 'Review KYC submission (admin only)' })
  @Roles('platform_admin', 'admin')
  async reviewSubmission(
    @Param('orgId') orgId: string,
    @Body() body: {
      decision: 'approved' | 'rejected';
      notes?: string;
      verificationLevel?: string;
    },
    @Request() req: any,
  ) {
    return this.kycService.reviewSubmission(
      orgId,
      req.user.userId,
      body.decision,
      body.notes,
      body.verificationLevel,
    );
  }
}
