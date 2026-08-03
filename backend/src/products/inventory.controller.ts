import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehouseInventoryService } from './warehouse-inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: WarehouseInventoryService) {}

  @Get('warehouses')
  @ApiOperation({ summary: 'Get warehouses by organization' })
  async getWarehouses(@Query('orgId') orgId: string) {
    return this.inventoryService.getWarehousesByOrg(orgId);
  }

  @Post('warehouses')
  @ApiOperation({ summary: 'Add a warehouse' })
  async addWarehouse(@Body() data: Parameters<WarehouseInventoryService['addWarehouse']>[0]) {
    return this.inventoryService.addWarehouse(data);
  }

  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async getWarehouse(@Param('id') id: string) {
    return this.inventoryService.getWarehouse(id);
  }

  @Get('warehouses/:id/items')
  @ApiOperation({ summary: 'Get inventory by warehouse' })
  async getInventoryByWarehouse(@Param('id') warehouseId: string) {
    return this.inventoryService.getInventoryByWarehouse(warehouseId);
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get inventory by product' })
  async getInventoryByProduct(@Param('productId') productId: string) {
    return this.inventoryService.getInventoryByProduct(productId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add inventory item' })
  async addItem(@Body() data: Parameters<WarehouseInventoryService['addInventory']>[0]) {
    return this.inventoryService.addInventory(data);
  }

  @Put('items/:id/quantity')
  @ApiOperation({ summary: 'Update inventory quantity' })
  async updateQuantity(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.updateInventoryQuantity(id, quantity);
  }

  @Put('items/:id/status')
  @ApiOperation({ summary: 'Update inventory status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: 'available' | 'reserved' | 'in_transit' | 'quarantine' | 'sold') {
    return this.inventoryService.updateInventoryStatus(id, status);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary for organization' })
  async getSummary(@Query('orgId') orgId: string) {
    return this.inventoryService.getInventorySummary(orgId);
  }
}
