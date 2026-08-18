import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { InspectionType } from '../entities/inspection.entity';

const INSPECTION_TYPES: InspectionType[] = ['pre_shipment', 'loading', 'discharge', 'destination', 'quality', 'quantity', 'packaging'];
// PATCH /inspections/:id/status writes this straight into Inspection.result,
// which is the `inspection_result` enum. There is no `status` column on the
// table. The list here previously held workflow-style states (requested,
// scheduled, ...), none of which are valid inspection_result values, so every
// accepted request violated the enum and 500'd — while 'pass' and 'fail', the
// values inspections.controller checks before firing onInspectionCompleted,
// were rejected by validation. That left the inspection-to-deal workflow
// hook unreachable.
const INSPECTION_STATUSES = ['pending', 'pass', 'fail', 'conditional', 'waiver'] as const;

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
