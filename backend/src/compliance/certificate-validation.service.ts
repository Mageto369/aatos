import { Injectable, Logger } from '@nestjs/common';

export interface ValidationResult {
  valid: boolean;
  documentType: string;
  issuer: string;
  issuedDate: Date;
  expiryDate?: Date;
  verifiedAt: Date;
  verificationMethod: string;
  errors: string[];
  warnings: string[];
}

export interface VerificationConfig {
  documentTypes: string[];
  requiredFields: string[];
  expiryCheck: boolean;
  issuerWhitelist?: string[];
  customRules?: Array<{ field: string; condition: string; value: unknown }>;
}

/**
 * Certificate Validation Service
 * Validates compliance documents, certificates, and credentials.
 */
@Injectable()
export class CertificateValidationService {
  private readonly logger = new Logger(CertificateValidationService.name);

  private readonly verificationConfigs: Map<string, VerificationConfig> = new Map([
    ['organic_certificate', {
      documentTypes: ['pdf', 'jpg', 'png'],
      requiredFields: ['certification_body', 'license_number', 'issue_date', 'expiry_date'],
      expiryCheck: true,
      issuerWhitelist: ['USDA-NOP', 'EU-Organic', 'JAS-Organic', 'Kiwa-BCS', 'Control Union'],
    }],
    ['fair_trade_certificate', {
      documentTypes: ['pdf'],
      requiredFields: ['certification_body', 'license_number', 'issue_date'],
      expiryCheck: true,
      issuerWhitelist: ['FLOCERT', 'Fairtrade International'],
    }],
    ['business_registration', {
      documentTypes: ['pdf', 'jpg'],
      requiredFields: ['registration_number', 'issue_date', 'issuing_authority'],
      expiryCheck: false,
    }],
    ['export_license', {
      documentTypes: ['pdf'],
      requiredFields: ['license_number', 'issue_date', 'expiry_date', 'issuing_authority'],
      expiryCheck: true,
    }],
    ['tax_compliance', {
      documentTypes: ['pdf'],
      requiredFields: ['tax_id', 'issue_date', 'issuing_authority'],
      expiryCheck: false,
    }],
  ]);

  async validateDocument(
    documentType: string,
    documentData: Record<string, unknown>,
    fileInfo: { mimeType: string; size: number },
  ): Promise<ValidationResult> {
    const config = this.verificationConfigs.get(documentType);
    if (!config) {
      return {
        valid: false,
        documentType,
        issuer: '',
        issuedDate: new Date(),
        verifiedAt: new Date(),
        verificationMethod: 'unknown_type',
        errors: [`Unknown document type: ${documentType}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    const ext = fileInfo.mimeType.split('/')[1];
    if (!config.documentTypes.includes(ext)) {
      errors.push(`Invalid file type: ${ext}. Expected: ${config.documentTypes.join(', ')}`);
    }

    // Check required fields
    for (const field of config.requiredFields) {
      if (documentData[field] === undefined || documentData[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check expiry
    if (config.expiryCheck && documentData.expiry_date) {
      const expiryDate = new Date(documentData.expiry_date as string);
      if (expiryDate < new Date()) {
        errors.push('Document has expired');
      } else if (expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('Document expires within 30 days');
      }
    }

    // Check issuer whitelist
    if (config.issuerWhitelist && documentData.certification_body) {
      const issuer = documentData.certification_body as string;
      if (!config.issuerWhitelist.includes(issuer)) {
        warnings.push(`Issuer ${issuer} not in recognized whitelist`);
      }
    }

    // Custom rules
    if (config.customRules) {
      for (const rule of config.customRules) {
        const value = documentData[rule.field];
        if (!this.evaluateRule(rule.condition, value, rule.value)) {
          errors.push(`Custom rule failed: ${rule.field} ${rule.condition} ${rule.value}`);
        }
      }
    }

    const valid = errors.length === 0;

    this.logger.log(`Document validation: ${documentType} - ${valid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`);

    return {
      valid,
      documentType,
      issuer: (documentData.certification_body || documentData.issuing_authority || '') as string,
      issuedDate: documentData.issue_date ? new Date(documentData.issue_date as string) : new Date(),
      expiryDate: documentData.expiry_date ? new Date(documentData.expiry_date as string) : undefined,
      verifiedAt: new Date(),
      verificationMethod: 'rule_based',
      errors,
      warnings,
    };
  }

  async validateBatch(documents: Array<{ type: string; data: Record<string, unknown>; fileInfo: { mimeType: string; size: number } }>): Promise<ValidationResult[]> {
    return Promise.all(documents.map(d => this.validateDocument(d.type, d.data, d.fileInfo)));
  }

  private evaluateRule(condition: string, actual: unknown, expected: unknown): boolean {
    switch (condition) {
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      case 'gt': return (actual as number) > (expected as number);
      case 'gte': return (actual as number) >= (expected as number);
      case 'lt': return (actual as number) < (expected as number);
      case 'lte': return (actual as number) <= (expected as number);
      case 'in': return (expected as unknown[]).includes(actual);
      default: return true;
    }
  }
}
