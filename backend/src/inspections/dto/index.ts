import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { InspectionType } from '../entities/inspection.entity';

const INSPECTION_TYPES: InspectionType[] = ['pre_shipment', 'loading', 'discharge', 'destination', 'quality', 'quantity', 'packaging'];
const INSPECTION_STATUSES = ['requested', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled'] as const;

export class CreateInspectionDto {
  @ApiProperty()
  @IsUUID()
  dealId: string;

  @ApiProperty({ enum: INSPECTION_TYPES })
  @IsEnum(INSPECTION_TYPES)
  inspectionType: InspectionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspectionLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInspectionDto {
  @ApiPropertyOptional({ enum: INSPECTION_STATUSES })
  @IsOptional()
  @IsEnum(INSPECTION_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passFailStatus?: string;
}
