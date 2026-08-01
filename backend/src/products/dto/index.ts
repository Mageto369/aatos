import { IsString, IsOptional, IsNumber, IsEnum, IsObject, IsArray, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UNITS = ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'] as const;
const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] as const;

export class CreateProductDto {
  @ApiProperty({ example: 'cat_coffee_arabica' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Kenya AA Arabica Coffee' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: 'object', example: { variety: 'Arabica', grade: 'AA', processing: 'washed' } })
  @IsObject()
  attributes: Record<string, any>;

  @ApiProperty({ example: 'KE' })
  @IsString()
  originCountry: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  availableQuantity: number;

  @ApiProperty({ enum: UNITS, example: 'mt' })
  @IsEnum(UNITS)
  availableUnit: string;

  @ApiPropertyOptional({ example: 4.85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceFob?: number;

  @ApiPropertyOptional({ example: 5.45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceCif?: number;

  @ApiPropertyOptional({ enum: INCOTERMS, example: 'FOB' })
  @IsOptional()
  @IsEnum(INCOTERMS)
  incoterm?: string;

  @ApiPropertyOptional({ type: [String], example: ['organic', 'fair_trade'] })
  @IsOptional()
  @IsArray()
  certifications?: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  availableQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceFob?: number;
}

export interface ProductFilters {
  category?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  certification?: string;
  destination?: string;
  q?: string;
  sort?: string;
  limit?: number;
  cursor?: string;
}
