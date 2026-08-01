import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RfqsService } from './rfqs.service';

@ApiTags('RFQs')
@Controller('rfqs')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class RfqsController {
  constructor(private readonly rfqsService: RfqsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RFQ' })
  create(@Body() data: any, @Request() req) {
    if (!req.user.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return this.rfqsService.create(req.user.userId, req.user.orgId, data);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an RFQ' })
  publish(@Param('id') id: string, @Request() req) {
    return this.rfqsService.publish(id, req.user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'List RFQs' })
  findAll(@Query() filters, @Request() req) {
    return this.rfqsService.findAll({ ...filters, orgId: req.user.orgId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ details' })
  findOne(@Param('id') id: string) {
    return this.rfqsService.findOne(id);
  }

  @Post(':id/quotes')
  @ApiOperation({ summary: 'Submit a quotation' })
  createQuotation(@Param('id') id: string, @Body() data: any, @Request() req) {
    if (!req.user.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    return this.rfqsService.createQuotation(id, req.user.orgId, req.user.userId, data);
  }

  @Get(':id/quotes')
  @ApiOperation({ summary: 'Get quotations for an RFQ' })
  getQuotations(@Param('id') id: string) {
    return this.rfqsService.getQuotations(id);
  }
}
