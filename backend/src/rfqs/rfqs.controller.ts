import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RfqsService } from './rfqs.service';
import { WorkflowService } from '../workflows/workflows.service';

@ApiTags('RFQs')
@Controller('rfqs')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class RfqsController {
  constructor(
    private readonly rfqsService: RfqsService,
    private readonly workflowService: WorkflowService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RFQ' })
  create(@Body() data: any, @Request() req: any) {
    if (!req.user.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return this.rfqsService.create(req.user.userId, req.user.orgId, data);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an RFQ' })
  async publish(@Param('id') id: string, @Request() req: any) {
    const result = await this.rfqsService.publish(id, req.user.orgId);
    // Trigger workflow: find matching suppliers and send notifications
    this.workflowService.onRfqPublished(id).catch(console.error);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List RFQs' })
  findAll(@Query() filters: any, @Request() req: any) {
    return this.rfqsService.findAll({ ...filters, orgId: req.user.orgId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ details' })
  findOne(@Param('id') id: string) {
    return this.rfqsService.findOne(id);
  }

  @Post(':id/quotes')
  @ApiOperation({ summary: 'Submit a quotation' })
  createQuotation(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    if (!req.user.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return this.rfqsService.createQuotation(id, req.user.orgId, req.user.userId, data);
  }

  @Post(':id/quotes/:quoteId/accept')
  @ApiOperation({ summary: 'Accept a quotation and create a deal' })
  async acceptQuote(
    @Param('id') rfqId: string,
    @Param('quoteId') quoteId: string,
    @Request() req: any,
  ) {
    if (!req.user.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    // Trigger the full deal creation workflow
    const deal = await this.workflowService.onQuoteAccepted(quoteId);
    return { success: true, dealId: deal.id, message: 'Quotation accepted. Deal created.' };
  }

  @Get(':id/quotes')
  @ApiOperation({ summary: 'Get quotations for an RFQ' })
  getQuotations(@Param('id') id: string) {
    return this.rfqsService.getQuotations(id);
  }
}
