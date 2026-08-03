import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFileName?: string;
}

export interface UploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  scanForMalware: boolean;
}

/**
 * Upload Validation Service
 * Validates file uploads for security and compliance.
 */
@Injectable()
export class UploadValidationService {
  private readonly logger = new Logger(UploadValidationService.name);
  private readonly defaultConfig: UploadConfig;

  constructor(private readonly config: ConfigService) {
    this.defaultConfig = {
      maxSizeBytes: this.parseSize(this.config.get('UPLOAD_MAX_SIZE', '10MB')),
      allowedMimeTypes: this.config.get('UPLOAD_ALLOWED_TYPES', 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv').split(','),
      allowedExtensions: this.config.get('UPLOAD_ALLOWED_EXTENSIONS', '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv').split(','),
      scanForMalware: this.config.get('UPLOAD_SCAN_MALWARE', 'false') === 'true',
    };
  }

  /**
   * Validate a file upload
   */
  async validateFile(
    file: { originalname: string; mimetype: string; size: number },
    config?: Partial<UploadConfig>,
  ): Promise<UploadValidationResult> {
    const cfg = { ...this.defaultConfig, ...config };

    // Check file size
    if (file.size > cfg.maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${this.formatBytes(cfg.maxSizeBytes)}`,
      };
    }

    // Check MIME type
    if (!cfg.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.mimetype}. Allowed: ${cfg.allowedMimeTypes.join(', ')}`,
      };
    }

    // Check extension
    const ext = this.getExtension(file.originalname).toLowerCase();
    if (!cfg.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file extension: ${ext}. Allowed: ${cfg.allowedExtensions.join(', ')}`,
      };
    }

    // Sanitize filename
    const sanitized = this.sanitizeFileName(file.originalname);

    // Check for path traversal
    if (sanitized.includes('..') || sanitized.includes('/')) {
      return {
        valid: false,
        error: 'Invalid filename: path traversal detected',
      };
    }

    return { valid: true, sanitizedFileName: sanitized };
  }

  /**
   * Validate image upload
   */
  async validateImage(file: { originalname: string; mimetype: string; size: number }): Promise<UploadValidationResult> {
    return this.validateFile(file, {
      maxSizeBytes: this.parseSize('5MB'),
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    });
  }

  /**
   * Validate document upload
   */
  async validateDocument(file: { originalname: string; mimetype: string; size: number }): Promise<UploadValidationResult> {
    return this.validateFile(file, {
      maxSizeBytes: this.parseSize('20MB'),
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png',
      ],
      allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.jpg', '.jpeg', '.png'],
    });
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  private getExtension(name: string): string {
    const lastDot = name.lastIndexOf('.');
    return lastDot === -1 ? '' : name.substring(lastDot);
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    const match = size.match(/^(\d+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 10 * 1024 * 1024; // default 10MB
    return parseInt(match[1]) * (units[match[2].toUpperCase()] || 1);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }
}
