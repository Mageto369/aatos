import {
  IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsInt, IsObject, Min, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UNITS = ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'] as const;
const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] as const;

/**
 * Body of POST /rfqs/:id/quotes.
 *
 * The required fields here are exactly the NOT NULL columns of `quotations`
 * that the caller owns — everything else on the row is either defaulted by the
 * database or filled in by the service (rfqId, supplierOrgId, createdByUserId,
 * status, validUntil, sentAt). Without this DTO a missing column surfaced as a
 * 500 carrying the raw Postgres constraint text.
 */
export class CreateQuotationDto {
  @ApiProperty({ example: 38000, description: 'Quantity the supplier is offering' })
  @IsNumber()
  @Min(0)
  quantityOffered: number;

  @ApiProperty({ enum: UNITS, example: 'kg', description: 'Unit the offered quantity is expressed in' })
  @IsEnum(UNITS)
  quantityUnit: string;

  @ApiProperty({ example: 5.1, description: 'Price for one `pricePerUnit`' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ enum: UNITS, example: 'kg', description: 'Unit the unit price is quoted per — a unit of measure, not a price' })
  @IsEnum(UNITS)
  pricePerUnit: string;

  @ApiProperty({ enum: CURRENCIES, example: 'USD' })
  @IsEnum(CURRENCIES)
  priceCurrency: string;

  @ApiProperty({ example: 193800, description: 'Total value of the offer' })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiProperty({ enum: INCOTERMS, example: 'FOB' })
  @IsEnum(INCOTERMS)
  incoterm: string;

  @ApiPropertyOptional({ description: 'Product being offered, if it is on the catalogue' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryTimeDays?: number;

  @ApiPropertyOptional({ example: '30% advance, 70% against documents' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentTerms?: string;

  @ApiPropertyOptional({ example: 30, description: 'Days the quote stays valid; defaults to 30' })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({ example: 'AA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  qualityGrade?: string;

  @ApiPropertyOptional({ example: '60kg jute bags, palletised' })
  @IsOptional()
  @IsString()
  packagingDetails?: string;

  @ApiPropertyOptional({ example: { grade: 'AA', process: 'washed' } })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notes from the supplier to the buyer' })
  @IsOptional()
  @IsString()
  supplierNotes?: string;
}
