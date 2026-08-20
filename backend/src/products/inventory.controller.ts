import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehouseInventoryService, Warehouse, WarehouseInventory } from './warehouse-inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Every route here used to name its own scope: two took an orgId straight off
 * the query string and returned that organization's warehouses and stock
 * valuation to anyone with a token, and the three :id routes took an item or
 * warehouse id with no request at all, so a caller could read — and re-quantity
 * or re-status — another company's stock. @Roles only asserted the caller held
 * a logistics role somewhere, not that the goods were theirs.
 *
 * The organization now comes from the token on every route and cannot be named
 * by the caller. Writes to a warehouse the caller does not own return 404, so a
 * stranger does not learn the id exists.
 *
 * The store behind this is in-process and non-durable — see the service.
 */
@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: WarehouseInventoryService) {}

  private orgOf(req: any): string {
    const orgId = req?.user?.orgId;
    if (!orgId) throw new NotFoundException('No organization on this account');
    return orgId;
  }

  @Get('warehouses')
  @ApiOperation({ summary: "Get the caller's warehouses" })
  async getWarehouses(@Request() req: any) {
    return this.inventoryService.getWarehousesByOrg(this.orgOf(req));
  }

  @Post('warehouses')
  @ApiOperation({ summary: 'Add a warehouse' })
  @Roles('owner', 'admin', 'operator')
  async addWarehouse(@Body() data: Omit<Warehouse, 'id' | 'orgId'>, @Request() req: any) {
    // orgId is taken from the token, never from the body.
    return this.inventoryService.addWarehouse({ ...data, orgId: this.orgOf(req) });
  }

  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async getWarehouse(@Param('id') id: string, @Request() req: any) {
    const warehouse = await this.inventoryService.getWarehouse(id, this.orgOf(req));
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  @Get('warehouses/:id/items')
  @ApiOperation({ summary: 'Get inventory by warehouse' })
  async getInventoryByWarehouse(@Param('id') warehouseId: string, @Request() req: any) {
    const orgId = this.orgOf(req);
    if (!(await this.inventoryService.getWarehouse(warehouseId, orgId))) {
      throw new NotFoundException('Warehouse not found');
    }
    return this.inventoryService.getInventoryByWarehouse(warehouseId, orgId);
  }

  @Get('products/:productId')
  @ApiOperation({ summary: "Get the caller's inventory of a product" })
  async getInventoryByProduct(@Param('productId') productId: string, @Request() req: any) {
    return this.inventoryService.getInventoryByProduct(productId, this.orgOf(req));
  }

  @Post('items')
  @ApiOperation({ summary: 'Add inventory item' })
  @Roles('owner', 'admin', 'operator', 'logistics_officer')
  async addItem(
    @Body() data: Omit<WarehouseInventory, 'id' | 'lastUpdated'>,
    @Request() req: any,
  ) {
    // Stock may only be placed in a warehouse the caller owns; ownership of the
    // item is resolved through that warehouse.
    const warehouse = await this.inventoryService.getWarehouse(data.warehouseId, this.orgOf(req));
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return this.inventoryService.addInventory({ ...data, warehouseName: warehouse.name });
  }

  @Put('items/:id/quantity')
  @ApiOperation({ summary: 'Update inventory quantity' })
  @Roles('owner', 'admin', 'operator', 'logistics_officer')
  async updateQuantity(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Request() req: any,
  ) {
    const item = await this.inventoryService.updateInventoryQuantity(
      id,
      quantity,
      this.orgOf(req),
    );
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  @Put('items/:id/status')
  @ApiOperation({ summary: 'Update inventory status' })
  @Roles('owner', 'admin', 'operator', 'logistics_officer')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: WarehouseInventory['status'],
    @Request() req: any,
  ) {
    const item = await this.inventoryService.updateInventoryStatus(id, status, this.orgOf(req));
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  @Get('summary')
  @ApiOperation({ summary: "Get the caller's inventory summary" })
  async getSummary(@Request() req: any) {
    return this.inventoryService.getInventorySummary(this.orgOf(req));
  }
}
