import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UploadValidationService } from './upload-validation.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, UploadValidationService],
  exports: [UploadService, UploadValidationService],
})
export class UploadModule {}
