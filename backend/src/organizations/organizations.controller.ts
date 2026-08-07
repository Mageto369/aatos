import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { PilotGuardService } from '../common/pilot-guard.service';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class OrganizationsController {
  constructor(
    private readonly orgService: OrganizationsService,
    private readonly pilotGuard: PilotGuardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 409, description: 'Organization already exists' })
  async create(@Body() dto: CreateOrganizationDto, @Request() req: any) {
    const { total } = await this.orgService.findAll({ limit: 1 });
    await this.pilotGuard.validateOrgCap(total);
    return this.orgService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter organizations' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'verificationLevel', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'trustScoreMin', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  findAll(@Query() filters: any) {
    return this.orgService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization found' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string) {
    return this.orgService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.orgService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @Roles('owner', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete organization' })
  @Roles('owner')
  remove(@Param('id') id: string) {
    return this.orgService.remove(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  getMembers(@Param('id') id: string) {
    return this.orgService.getMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to organization' })
  @Roles('owner', 'admin')
  addMember(@Param('id') orgId: string, @Body('userId') userId: string, @Body('role') role: string) {
    return this.orgService.addMember(orgId, userId, role);
  }
}
