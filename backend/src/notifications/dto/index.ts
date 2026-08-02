import { IsString, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const NOTIF_TYPES = ['deal_update', 'rfq_match', 'message_received', 'milestone_completed', 'document_reviewed', 'inspection_scheduled', 'compliance_alert', 'system'] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  recipientUserId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  recipientOrgId?: string;

  @ApiProperty({ enum: NOTIF_TYPES })
  @IsEnum(NOTIF_TYPES)
  type: string;

  @ApiProperty({ example: 'New quote received' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'You have received a new quote for RFQ #1234' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: PRIORITIES, default: 'normal' })
  @IsOptional()
  @IsEnum(PRIORITIES)
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  actionUrl?: string;
}
