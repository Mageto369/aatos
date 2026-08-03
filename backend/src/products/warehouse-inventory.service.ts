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
 * Warehouse & Inventory Visibility Service
 * Tracks inventory across warehouses for supply chain visibility.
 */
@Injectable()
export class WarehouseInventoryService {
  private readonly logger = new Logger(WarehouseInventoryService.name);
  private readonly warehouses: Map<string, Warehouse> = new Map();
  private readonly inventory: Map<string, WarehouseInventory> = new Map();

  constructor() {
    this.initializeWarehouses();
  }

  async addWarehouse(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: crypto.randomUUID(),
    };
    this.warehouses.set(newWarehouse.id, newWarehouse);
    this.logger.log(`Warehouse added: ${newWarehouse.name}`);
    return newWarehouse;
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }

  async getWarehousesByOrg(orgId: string): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values()).filter(w => w.orgId === orgId);
  }

  async addInventory(item: Omit<WarehouseInventory, 'id' | 'lastUpdated'>): Promise<WarehouseInventory> {
    const newItem: WarehouseInventory = {
      ...item,
      id: crypto.randomUUID(),
      lastUpdated: new Date(),
    };
    this.inventory.set(newItem.id, newItem);
    this.logger.log(`Inventory added: ${newItem.productName} at ${newItem.warehouseName}`);
    return newItem;
  }

  async updateInventoryQuantity(itemId: string, newQuantity: number): Promise<WarehouseInventory | undefined> {
    const item = this.inventory.get(itemId);
    if (!item) return undefined;

    item.quantity = newQuantity;
    item.lastUpdated = new Date();
    this.inventory.set(itemId, item);
    return item;
  }

  async updateInventoryStatus(itemId: string, status: WarehouseInventory['status']): Promise<WarehouseInventory | undefined> {
    const item = this.inventory.get(itemId);
    if (!item) return undefined;

    item.status = status;
    item.lastUpdated = new Date();
    this.inventory.set(itemId, item);
    this.logger.log(`Inventory status updated: ${itemId} → ${status}`);
    return item;
  }

  async getInventoryByWarehouse(warehouseId: string): Promise<WarehouseInventory[]> {
    return Array.from(this.inventory.values()).filter(i => i.warehouseId === warehouseId);
  }

  async getInventoryByProduct(productId: string): Promise<WarehouseInventory[]> {
    return Array.from(this.inventory.values()).filter(i => i.productId === productId);
  }

  async getAvailableInventory(productId: string): Promise<WarehouseInventory[]> {
    return Array.from(this.inventory.values()).filter(
      i => i.productId === productId && i.status === 'available' && i.quantity > 0,
    );
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
      const warehouseItems = await this.getInventoryByWarehouse(w.id);
      items.push(...warehouseItems);
    }

    const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.metadata.price as number || 0)), 0);
    const availableValue = items
      .filter(i => i.status === 'available')
      .reduce((sum, i) => sum + (i.quantity * (i.metadata.price as number || 0)), 0);
    const reservedValue = items
      .filter(i => i.status === 'reserved')
      .reduce((sum, i) => sum + (i.quantity * (i.metadata.price as number || 0)), 0);
    const lowStockItems = items.filter(i => i.quantity < 100).length;

    return {
      totalWarehouses: warehouses.length,
      totalItems: items.length,
      totalValue,
      availableValue,
      reservedValue,
      lowStockItems,
    };
  }

  private initializeWarehouses(): void {
    // Initialize with sample warehouses for demonstration
    const sampleWarehouses: Omit<Warehouse, 'id'>[] = [
      {
        name: 'Nairobi Coffee Hub',
        orgId: 'sample-org-1',
        location: { country: 'KE', city: 'Nairobi', address: 'Industrial Area, Enterprise Road' },
        type: 'origin',
        capacity: 500000,
        certifications: ['ISO-9001', 'BRC'],
        active: true,
      },
      {
        name: 'Mombasa Export Terminal',
        orgId: 'sample-org-1',
        location: { country: 'KE', city: 'Mombasa', address: 'Kilindini Harbour' },
        type: 'transit',
        capacity: 1000000,
        certifications: ['AEO', 'ISO-9001'],
        active: true,
      },
      {
        name: 'New Jersey Distribution Center',
        orgId: 'sample-org-2',
        location: { country: 'US', city: 'Newark', address: 'Port Newark-Elizabeth' },
        type: 'destination',
        capacity: 750000,
        certifications: ['USDA-Organic', 'SQF'],
        active: true,
      },
    ];

    for (const w of sampleWarehouses) {
      this.addWarehouse(w);
    }
  }
}
