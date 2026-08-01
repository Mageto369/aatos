import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
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
    const orgId = req.headers['x-organization-id'];
    return this.rfqsService.create(req.user.userId, orgId, data);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an RFQ' })
  publish(@Param('id') id: string, @Request() req) {
    const orgId = req.headers['x-organization-id'];
    return this.rfqsService.publish(id, orgId);
  }

  @Get()
  @ApiOperation({ summary: 'List RFQs' })
  findAll(@Query() filters, @Request() req) {
    const orgId = req.headers['x-organization-id'];
    return this.rfqsService.findAll({ ...filters, orgId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ details' })
  findOne(@Param('id') id: string) {
    return this.rfqsService.findOne(id);
  }

  @Post(':id/quotes')
  @ApiOperation({ summary: 'Submit a quotation' })
  createQuotation(@Param('id') id: string, @Body() data: any, @Request() req) {
    const orgId = req.headers['x-organization-id'];
    return this.rfqsService.createQuotation(id, orgId, req.user.userId, data);
  }

  @Get(':id/quotes')
  @ApiOperation({ summary: 'Get quotations for an RFQ' })
  getQuotations(@Param('id') id: string) {
    return this.rfqsService.getQuotations(id);
  }
}
