import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
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
  create(@Body() dto: CreateDealDto) {
    return this.dealsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List deals for organization' })
  findAll(@Query() filters, @Request() req) {
    const orgId = req.headers['x-organization-id'];
    return this.dealsService.findAll({ ...filters, orgId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal details' })
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Patch(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Update milestone status' })
  updateMilestone(
    @Param('id') dealId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
    @Request() req,
  ) {
    const orgId = req.headers['x-organization-id'];
    return this.dealsService.updateMilestone(dealId, milestoneId, orgId, dto);
  }
}
