import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
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
  async triggerQuoteAccept(@Param('id') quoteId: string) {
    const deal = await this.workflowService.onQuoteAccepted(quoteId);
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
