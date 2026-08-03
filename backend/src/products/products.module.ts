import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { InventoryController } from './inventory.controller';
import { WarehouseInventoryService } from './warehouse-inventory.service';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductCategory])],
  providers: [ProductsService, WarehouseInventoryService],
  controllers: [ProductsController, InventoryController],
  exports: [ProductsService, WarehouseInventoryService],
})
export class ProductsModule {}
