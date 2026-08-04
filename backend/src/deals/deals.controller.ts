import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DealsService } from './deals.service';
import { WorkflowService } from '../workflows/workflows.service';
import { CreateDealDto, UpdateMilestoneDto } from './dto';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly workflowService: WorkflowService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Deal created' })
  create(@Body() dto: CreateDealDto, @Request() req: any) {
    if (!req.user.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return this.dealsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List deals for organization' })
  findAll(@Query() filters: any, @Request() req: any) {
    return this.dealsService.findAll({ ...filters, orgId: req.user.orgId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal details' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const deal = await this.dealsService.findOne(id);
    // Authorization check
    if (deal.buyerOrgId !== req.user.orgId && deal.supplierOrgId !== req.user.orgId) {
      throw new ForbiddenException('Not authorized to view this deal');
    }
    return deal;
  }

  @Patch(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Update milestone status' })
  async updateMilestone(
    @Param('id') dealId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
    @Request() req: any,
  ) {
    const milestone = await this.dealsService.updateMilestone(dealId, milestoneId, req.user.orgId, dto);
    // Trigger workflow for completed milestones (payment releases, status transitions)
    if (dto.status === 'completed') {
      this.workflowService.onMilestoneCompleted(milestoneId).catch(console.error);
    }
    return milestone;
  }
}
