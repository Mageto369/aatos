import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DocumentStatus } from '../entities/document.entity';

const DOC_TYPES = ['contract', 'invoice', 'certificate', 'inspection_report', 'shipping_doc', 'compliance_doc', 'other'] as const;
const DOC_STATUSES: DocumentStatus[] = ['uploaded', 'pending_review', 'verified', 'rejected', 'expired', 'revoked'];

export class CreateDocumentDto {
  @ApiProperty({ example: 'Export Contract - Kenya Coffee' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DOC_TYPES, example: 'contract' })
  @IsEnum(DOC_TYPES)
  documentType: string;

  @ApiProperty({ example: 'contract.pdf' })
  @IsString()
  originalFilename: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 1048576 })
  @IsNumber()
  fileSizeBytes: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3Key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3Url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checksumSha256?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dealId?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: DOC_STATUSES })
  @IsOptional()
  @IsEnum(DOC_STATUSES)
  status?: DocumentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
