import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product listing' })
  @ApiResponse({ status: 201, description: 'Product created' })
  create(@Body() dto: CreateProductDto, @Request() req: any) {
    // Active org would come from middleware/context
    const orgId = req.headers['x-organization-id'] || req.user.userId;
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
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req: any) {
    const orgId = req.headers['x-organization-id'] || req.user.userId;
    return this.productsService.update(id, req.user.userId, orgId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  remove(@Param('id') id: string, @Request() req: any) {
    const orgId = req.headers['x-organization-id'] || req.user.userId;
    return this.productsService.remove(id, orgId);
  }
}
