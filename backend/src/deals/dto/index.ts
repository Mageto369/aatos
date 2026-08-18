import { IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsArray, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UNITS = ['kg', 'mt', 'lb', 'ton', 'bag', 'box', 'carton', 'container_20ft', 'container_40ft', 'liter', 'gallon', 'piece', 'dozen', 'pallet'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ETB', 'GHS'] as const;
const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] as const;

class MilestoneDto {
  @ApiProperty({ example: 'contract_signing' })
  @IsString()
  milestoneType: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sequenceOrder?: number;

  @ApiPropertyOptional({ example: '2026-08-10' })
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  paymentPercentage?: number;

  @ApiPropertyOptional({ example: 153000 })
  @IsOptional()
  @IsNumber()
  paymentAmount?: number;
}

export class CreateDealDto {
  @ApiProperty()
  @IsUUID()
  buyerOrgId: string;

  @ApiProperty()
  @IsUUID()
  supplierOrgId: string;

  @ApiProperty({ example: 'Kenya AA Coffee — 100MT to Hamburg' })
  @IsString()
  title: string;

  @ApiProperty()
  @IsUUID()
  productCategoryId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  agreedQuantity: number;

  @ApiProperty({ enum: UNITS, example: 'mt' })
  @IsEnum(UNITS)
  quantityUnit: string;

  @ApiProperty({ example: 5.10 })
  @IsNumber()
  @Min(0)
  agreedPrice: number;

  @ApiProperty({ enum: CURRENCIES, example: 'USD' })
  @IsEnum(CURRENCIES)
  priceCurrency: string;

  @ApiProperty({ enum: INCOTERMS, example: 'CIF' })
  @IsEnum(INCOTERMS)
  incoterm: string;

  @ApiProperty({ example: 'KE', description: 'Origin country, ISO 3166-1 alpha-2' })
  @IsString()
  @Length(2, 2)
  originCountry: string;

  @ApiProperty({ example: 'US', description: 'Destination country, ISO 3166-1 alpha-2' })
  @IsString()
  @Length(2, 2)
  destinationCountry: string;

  @ApiPropertyOptional({ type: [MilestoneDto] })
  @IsOptional()
  @IsArray()
  milestones?: MilestoneDto[];
}

export class UpdateMilestoneDto {
  @ApiProperty({ example: 'completed' })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidenceDocumentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
