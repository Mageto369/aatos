import { IsString, IsOptional, IsEnum, IsNumber, IsEmail, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ORG_TYPES = ['farmer', 'cooperative', 'aggregator', 'processor', 'manufacturer',
  'exporter', 'trader', 'importer', 'distributor', 'retailer', 'hospitality',
  'government', 'ngo', 'lab', 'inspector', 'certifier', 'freight_forwarder',
  'customs_broker', 'warehouse', 'insurer', 'bank', 'trade_finance', 'consultant'] as const;

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Nairobi Coffee Exporters Ltd' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: ORG_TYPES, example: 'exporter' })
  @IsEnum(ORG_TYPES)
  type: string;

  @ApiProperty({ example: 'KE' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  countryCode: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Premium coffee exporter...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  annualCapacity?: number;
}

export interface OrganizationFilters {
  type?: string;
  country?: string;
  status?: string;
  verificationLevel?: string;
  q?: string;
  trustScoreMin?: number;
  sort?: string;
  limit?: number;
  cursor?: string;
}
