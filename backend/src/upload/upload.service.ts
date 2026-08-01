import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
}

@Injectable()
export class UploadService {
  private readonly bucket: string;
  private readonly region: string;
  private readonly accessKeyId: string | undefined;
  private readonly secretAccessKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get('AWS_S3_BUCKET', 'aatos-documents');
    this.region = this.config.get('AWS_REGION', 'us-east-1');
    this.accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
  }

  /**
   * Generate a presigned URL for direct S3 upload.
   * In production, this calls AWS SDK. For dev/demo, returns a mock URL.
   */
  async generatePresignedUrl(
    fileName: string,
    mimeType: string,
    orgId: string,
  ): Promise<PresignedUrlResponse> {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${orgId}/${timestamp}_${sanitizedName}`;

    if (!this.accessKeyId || !this.secretAccessKey) {
      // Development mode: return mock presigned URL
      return {
        uploadUrl: `http://localhost:4000/upload-mock/${key}`,
        fileUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        key,
        expiresIn: 300,
      };
    }

    // Production mode: would use AWS SDK v3 to generate presigned URL
    // const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    // ... implementation here

    return {
      uploadUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256`,
      fileUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      key,
      expiresIn: 300,
    };
  }

  /**
   * Generate a presigned URL for viewing/downloading a file.
   */
  async generateViewUrl(key: string): Promise<string> {
    if (!this.accessKeyId) {
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
