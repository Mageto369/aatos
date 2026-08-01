import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for S3 upload' })
  async getPresignedUrl(
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
    @Request() req,
  ) {
    const result = await this.uploadService.generatePresignedUrl(
      fileName,
      mimeType,
      req.user.orgId,
    );
    return result;
  }
}
