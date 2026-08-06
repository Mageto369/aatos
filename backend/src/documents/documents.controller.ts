import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a document record' })
  @Roles('owner', 'admin', 'operator', 'compliance_officer')
  async create(@Body() data: CreateDocumentDto, @Req() req: any) {
    return this.documentsService.create(req.user.orgId, req.user.userId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List documents for organization' })
  @ApiQuery({ name: 'dealId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async findAll(
    @Query('dealId') dealId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Req() req?: any,
  ) {
    return this.documentsService.findAll({
      orgId: req.user.orgId,
      dealId,
      documentType: type,
      status,
      limit,
      offset,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findOne(id, req.user.orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @Roles('owner', 'admin', 'operator', 'compliance_officer')
  async update(@Param('id') id: string, @Body() data: UpdateDocumentDto, @Req() req: any) {
    return this.documentsService.update(id, req.user.orgId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete document' })
  @Roles('owner', 'admin')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.documentsService.remove(id, req.user.orgId);
    return { message: 'Document deleted' };
  }
}
