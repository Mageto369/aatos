import { Controller, Post, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkflowService } from './workflows.service';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class WorkflowsController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('rfq/:id/publish')
  @ApiOperation({ summary: 'Manually trigger RFQ published workflow' })
  @Roles('owner', 'admin', 'operator')
  async triggerRfqPublish(@Param('id') rfqId: string) {
    await this.workflowService.onRfqPublished(rfqId);
    return { success: true, message: `RFQ ${rfqId} publish workflow triggered` };
  }

  @Post('quote/:id/accept')
  @ApiOperation({ summary: 'Manually trigger quote acceptance workflow' })
  @Roles('owner', 'admin', 'operator')
  async triggerQuoteAccept(@Param('id') quoteId: string, @Request() req: any) {
    // Same rule as POST /rfqs/:id/quotes/:quoteId/accept: only the buying
    // organization may award. This route bypassed that check entirely, so
    // fixing the other one alone would have left the hole open next door.
    if (!req.user?.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    const deal = await this.workflowService.onQuoteAccepted(quoteId, req.user.orgId);
    return { success: true, dealId: deal.id, message: `Quote ${quoteId} accepted. Deal created.` };
  }

  @Post('milestone/:id/complete')
  @ApiOperation({ summary: 'Manually trigger milestone completion workflow' })
  @Roles('owner', 'admin', 'operator')
  async triggerMilestoneComplete(@Param('id') milestoneId: string) {
    await this.workflowService.onMilestoneCompleted(milestoneId);
    return { success: true, message: `Milestone ${milestoneId} completion workflow triggered` };
  }

  @Post('inspection/:id/result')
  @ApiOperation({ summary: 'Manually trigger inspection result workflow' })
  @Roles('owner', 'admin', 'operator', 'logistics_officer')
  async triggerInspectionResult(
    @Param('id') inspectionId: string,
    @Body() body: { result: string },
  ) {
    await this.workflowService.onInspectionCompleted(inspectionId, body.result);
    return { success: true, message: `Inspection ${inspectionId} result workflow triggered` };
  }
}
