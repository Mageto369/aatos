import { Injectable, Logger } from '@nestjs/common';

export interface WarehouseInventory {
  id: string;
  warehouseId: string;
  warehouseName: string;
  location: {
    country: string;
    city: string;
    address: string;
  };
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  quality: string;
  status: 'available' | 'reserved' | 'in_transit' | 'quarantine' | 'sold';
  lotNumber?: string;
  expiryDate?: Date;
  lastUpdated: Date;
  metadata: Record<string, unknown>;
}

export interface Warehouse {
  id: string;
  name: string;
  orgId: string;
  location: {
    country: string;
    city: string;
    address: string;
  };
  type: 'origin' | 'transit' | 'destination';
  capacity: number;
  certifications: string[];
  active: boolean;
}

/**
 * Warehouse and inventory visibility.
 *
 * NOT DURABLE. Everything here lives in two in-process Maps: a restart empties
 * them, and with more than one replica a write lands on whichever instance
 * served it while reads go somewhere else. This is a prototype surface, not a
 * system of record, and it must not carry stock a trade depends on until it is
 * backed by tables. Nothing in the product reads these endpoints today.
 *
 * It previously seeded three invented warehouses under two organization ids
 * that do not exist, and served them through authenticated endpoints as if
 * they were real holdings. That seed is gone.
 *
 * Every read and write is scoped by the caller's organization. Items have no
 * orgId of their own, so ownership resolves through the warehouse that holds
 * them; an item in no known warehouse belongs to nobody and is invisible.
 */
@Injectable()
export class WarehouseInventoryService {
  private readonly logger = new Logger(WarehouseInventoryService.name);
  private readonly warehouses: Map<string, Warehouse> = new Map();
  private readonly inventory: Map<string, WarehouseInventory> = new Map();

  async addWarehouse(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: crypto.randomUUID(),
    };
    this.warehouses.set(newWarehouse.id, newWarehouse);
    this.logger.log(`Warehouse added: ${newWarehouse.name}`);
    return newWarehouse;
  }

  /** The warehouse, only if it belongs to orgId. Otherwise undefined. */
  async getWarehouse(id: string, orgId: string): Promise<Warehouse | undefined> {
    const warehouse = this.warehouses.get(id);
    return warehouse && warehouse.orgId === orgId ? warehouse : undefined;
  }

  async getWarehousesByOrg(orgId: string): Promise<Warehouse[]> {
    if (!orgId) return [];
    return Array.from(this.warehouses.values()).filter((w) => w.orgId === orgId);
  }

  /** The organization holding an item, via the warehouse it sits in. */
  private ownerOf(item: WarehouseInventory): string | undefined {
    return this.warehouses.get(item.warehouseId)?.orgId;
  }

  private ownedItem(itemId: string, orgId: string): WarehouseInventory | undefined {
    const item = this.inventory.get(itemId);
    if (!item || !orgId || this.ownerOf(item) !== orgId) return undefined;
    return item;
  }

  async addInventory(
    item: Omit<WarehouseInventory, 'id' | 'lastUpdated'>,
  ): Promise<WarehouseInventory> {
    const newItem: WarehouseInventory = {
      ...item,
      id: crypto.randomUUID(),
      lastUpdated: new Date(),
    };
    this.inventory.set(newItem.id, newItem);
    this.logger.log(`Inventory added: ${newItem.productName} at ${newItem.warehouseName}`);
    return newItem;
  }

  async updateInventoryQuantity(
    itemId: string,
    newQuantity: number,
    orgId: string,
  ): Promise<WarehouseInventory | undefined> {
    const item = this.ownedItem(itemId, orgId);
    if (!item) return undefined;

    item.quantity = newQuantity;
    item.lastUpdated = new Date();
    this.inventory.set(itemId, item);
    return item;
  }

  async updateInventoryStatus(
    itemId: string,
    status: WarehouseInventory['status'],
    orgId: string,
  ): Promise<WarehouseInventory | undefined> {
    const item = this.ownedItem(itemId, orgId);
    if (!item) return undefined;

    item.status = status;
    item.lastUpdated = new Date();
    this.inventory.set(itemId, item);
    this.logger.log(`Inventory status updated: ${itemId} → ${status}`);
    return item;
  }

  async getInventoryByWarehouse(warehouseId: string, orgId: string): Promise<WarehouseInventory[]> {
    const warehouse = await this.getWarehouse(warehouseId, orgId);
    if (!warehouse) return [];
    return Array.from(this.inventory.values()).filter((i) => i.warehouseId === warehouseId);
  }

  async getInventoryByProduct(productId: string, orgId: string): Promise<WarehouseInventory[]> {
    if (!orgId) return [];
    return Array.from(this.inventory.values()).filter(
      (i) => i.productId === productId && this.ownerOf(i) === orgId,
    );
  }

  /**
   * Stock a buyer may draw on. Callers pass the organization whose stock they
   * are asking about — this is not a cross-tenant view.
   */
  async getAvailableInventory(productId: string, orgId: string): Promise<WarehouseInventory[]> {
    const items = await this.getInventoryByProduct(productId, orgId);
    return items.filter((i) => i.status === 'available' && i.quantity > 0);
  }

  async getInventorySummary(orgId: string): Promise<{
    totalWarehouses: number;
    totalItems: number;
    totalValue: number;
    availableValue: number;
    reservedValue: number;
    lowStockItems: number;
  }> {
    const warehouses = await this.getWarehousesByOrg(orgId);
    const items: WarehouseInventory[] = [];
    for (const w of warehouses) {
      items.push(...(await this.getInventoryByWarehouse(w.id, orgId)));
    }

    const value = (of: WarehouseInventory[]): number =>
      of.reduce((sum, i) => sum + i.quantity * ((i.metadata.price as number) || 0), 0);

    return {
      totalWarehouses: warehouses.length,
      totalItems: items.length,
      totalValue: value(items),
      availableValue: value(items.filter((i) => i.status === 'available')),
      reservedValue: value(items.filter((i) => i.status === 'reserved')),
      lowStockItems: items.filter((i) => i.quantity < 100).length,
    };
  }
}
