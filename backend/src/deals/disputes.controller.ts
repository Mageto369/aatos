import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { DisputeService } from './dispute.service';

@ApiTags('Disputes')
@Controller('disputes')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class DisputesController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post('deal/:dealId')
  @ApiOperation({ summary: 'File a dispute for a deal' })
  async createDispute(
    @Param('dealId') dealId: string,
    @Body() body: {
      category: 'quality' | 'quantity' | 'payment' | 'delivery' | 'documentation' | 'other';
      description: string;
      evidence?: Array<{ type: string; url: string; description?: string }>;
    },
    @Request() req: any,
  ) {
    return this.disputeService.createDispute(
      dealId,
      req.user.userId,
      req.user.orgId,
      body,
    );
  }

  @Get('deal/:dealId')
  @ApiOperation({ summary: 'List disputes for a deal' })
  async getDealDisputes(
    @Param('dealId') dealId: string,
    @Request() req: any,
  ) {
    return this.disputeService.getDealDisputes(dealId, req.user.orgId);
  }

  @Get('all')
  @ApiOperation({ summary: 'List all disputes (admin only)' })
  @Roles('platform_admin', 'admin')
  async getAllDisputes() {
    return this.disputeService.getAllDisputes();
  }

  @Patch('deal/:dealId/:disputeId')
  @ApiOperation({ summary: 'Update dispute status (admin only)' })
  @Roles('platform_admin', 'admin')
  async updateDispute(
    @Param('dealId') dealId: string,
    @Param('disputeId') disputeId: string,
    @Body() body: {
      status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'closed';
      resolution?: string;
    },
    @Request() req: any,
  ) {
    return this.disputeService.updateDispute(dealId, disputeId, req.user.userId, body);
  }
}
