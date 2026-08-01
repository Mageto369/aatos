import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InspectionsService } from './inspections.service';

@ApiTags('Inspections')
@Controller('inspections')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Request a new inspection' })
  async create(@Body() data: any, @Request() req) {
    return this.inspectionsService.create(req.user.orgId, req.user.userId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List inspections' })
  async findAll(
    @Query('dealId') dealId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req,
  ) {
    return this.inspectionsService.findAll({
      orgId: req.user.orgId,
      dealId,
      status,
      type,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inspection details' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.inspectionsService.findOne(id, req.user.orgId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inspection status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body() data: any,
    @Request() req,
  ) {
    return this.inspectionsService.updateStatus(id, req.user.orgId, status, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel inspection' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.inspectionsService.remove(id, req.user.orgId);
    return { message: 'Inspection cancelled' };
  }
}
