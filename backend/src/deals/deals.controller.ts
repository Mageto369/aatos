import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateMilestoneDto } from './dto';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Deal created' })
  create(@Body() dto: CreateDealDto, @Request() req) {
    if (!req.user.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return this.dealsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List deals for organization' })
  findAll(@Query() filters, @Request() req) {
    return this.dealsService.findAll({ ...filters, orgId: req.user.orgId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal details' })
  async findOne(@Param('id') id: string, @Request() req) {
    const deal = await this.dealsService.findOne(id);
    // Authorization check
    if (deal.buyerOrgId !== req.user.orgId && deal.supplierOrgId !== req.user.orgId) {
      throw new ForbiddenException('Not authorized to view this deal');
    }
    return deal;
  }

  @Patch(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Update milestone status' })
  updateMilestone(
    @Param('id') dealId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
    @Request() req,
  ) {
    return this.dealsService.updateMilestone(dealId, milestoneId, req.user.orgId, dto);
  }
}
