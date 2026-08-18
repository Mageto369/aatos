import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { PilotGuardService } from '../common/pilot-guard.service';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';

/**
 * Resolves the acting organization from the authenticated principal.
 *
 * The org must come from the JWT, never from a request header: a header is
 * client-controlled, so trusting it would let any authenticated user create or
 * modify products belonging to an organization they are not a member of.
 */
function actingOrgId(req: any): string {
  if (!req.user?.orgId) {
    throw new ForbiddenException('User must belong to an organization');
  }
  return req.user.orgId;
}

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly pilotGuard: PilotGuardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a product listing' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @Roles('owner', 'admin', 'operator')
  create(@Body() dto: CreateProductDto, @Request() req: any) {
    this.pilotGuard.validateCommodity(dto.categoryId);
    const orgId = actingOrgId(req);
    return this.productsService.create(req.user.userId, orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter products' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'certification', required: false })
  @ApiQuery({ name: 'destination', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  findAll(@Query() filters: any) {
    return this.productsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @Roles('owner', 'admin', 'operator')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req: any) {
    const orgId = actingOrgId(req);
    return this.productsService.update(id, req.user.userId, orgId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @Roles('owner', 'admin')
  remove(@Param('id') id: string, @Request() req: any) {
    const orgId = actingOrgId(req);
    return this.productsService.remove(id, orgId);
  }
}
