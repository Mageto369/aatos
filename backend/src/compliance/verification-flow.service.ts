import { Injectable } from '@nestjs/common';

export interface VerificationStep {
  id: string;
  name: string;
  description: string;
  requiredDocuments: string[];
  verificationMethod: string;
  estimatedTimeDays: number;
  externalService?: string;
  autoCheck?: boolean;
}

export interface VerificationFlow {
  countryCode: string;
  orgType: string;
  steps: VerificationStep[];
  minimumVerificationLevel: string;
}

/**
 * Verification Flow Service
 * Defines country-specific and org-type-specific verification requirements.
 */
@Injectable()
export class VerificationFlowService {
  private readonly flows: Map<string, VerificationFlow> = new Map();

  constructor() {
    this.initializeFlows();
  }

  getFlow(countryCode: string, orgType: string): VerificationFlow | undefined {
    return this.flows.get(`${countryCode}:${orgType}`);
  }

  getStepsForLevel(countryCode: string, orgType: string, level: string): VerificationStep[] {
    const flow = this.getFlow(countryCode, orgType);
    if (!flow) return [];

    const levelIndex = this.levelIndex(level);
    return flow.steps.filter((_, i) => i <= levelIndex);
  }

  private initializeFlows(): void {
    // Kenya — Supplier (Exporter/Cooperative/Farmer)
    this.flows.set('KE:cooperative', {
      countryCode: 'KE',
      orgType: 'cooperative',
      minimumVerificationLevel: 'business_registration',
      steps: [
        {
          id: 'ke-email-phone',
          name: 'Email and Phone Verification',
          description: 'Verify email via OTP and phone via SMS',
          requiredDocuments: [],
          verificationMethod: 'automated',
          estimatedTimeDays: 0,
          autoCheck: true,
        },
        {
          id: 'ke-business-reg',
          name: 'Business Registration',
          description: 'Verify business registration with Kenya Business Registration Service',
          requiredDocuments: ['business_registration'],
          verificationMethod: 'document_review',
          estimatedTimeDays: 1,
          externalService: 'Kenya Business Registration Service (BRS)',
        },
        {
          id: 'ke-tax-compliance',
          name: 'Tax Compliance',
          description: 'Verify KRA PIN and tax compliance status',
          requiredDocuments: ['tax_certificate'],
          verificationMethod: 'api_check',
          estimatedTimeDays: 1,
          externalService: 'Kenya Revenue Authority (KRA)',
          autoCheck: true,
        },
        {
          id: 'ke-physical-site',
          name: 'Physical Site Verification',
          description: 'On-site visit to verify physical location and operations',
          requiredDocuments: [],
          verificationMethod: 'physical_inspection',
          estimatedTimeDays: 5,
        },
        {
          id: 'ke-bank-verification',
          name: 'Bank Account Verification',
          description: 'Verify bank account ownership via micro-deposit or bank statement',
          requiredDocuments: ['bank_statement'],
          verificationMethod: 'micro_deposit',
          estimatedTimeDays: 3,
        },
        {
          id: 'ke-trade-references',
          name: 'Trade References',
          description: 'Contact at least 2 previous buyers for reference checks',
          requiredDocuments: [],
          verificationMethod: 'reference_check',
          estimatedTimeDays: 7,
        },
      ],
    });

    this.flows.set('KE:farmer', {
      countryCode: 'KE',
      orgType: 'farmer',
      minimumVerificationLevel: 'business_registration',
      steps: [
        {
          id: 'ke-farmer-email-phone',
          name: 'Email and Phone Verification',
          description: 'Verify email via OTP and phone via SMS',
          requiredDocuments: [],
          verificationMethod: 'automated',
          estimatedTimeDays: 0,
          autoCheck: true,
        },
        {
          id: 'ke-farmer-id',
          name: 'Identity Verification',
          description: 'Verify national ID or passport',
          requiredDocuments: ['identity_document'],
          verificationMethod: 'document_review',
          estimatedTimeDays: 1,
        },
        {
          id: 'ke-farmer-land',
          name: 'Land Ownership Verification',
          description: 'Verify land ownership or lease agreement',
          requiredDocuments: ['land_title', 'lease_agreement'],
          verificationMethod: 'document_review',
          estimatedTimeDays: 2,
        },
        {
          id: 'ke-farmer-site',
          name: 'Farm Site Verification',
          description: 'On-site visit to verify farm location and operations',
          requiredDocuments: [],
          verificationMethod: 'physical_inspection',
          estimatedTimeDays: 5,
        },
        {
          id: 'ke-farmer-bank',
          name: 'Bank Account Verification',
          description: 'Verify bank account ownership',
          requiredDocuments: ['bank_statement'],
          verificationMethod: 'micro_deposit',
          estimatedTimeDays: 3,
        },
      ],
    });

    // United States — Buyer (Importer/Distributor)
    this.flows.set('US:importer', {
      countryCode: 'US',
      orgType: 'importer',
      minimumVerificationLevel: 'business_registration',
      steps: [
        {
          id: 'us-email-phone',
          name: 'Email and Phone Verification',
          description: 'Verify email via OTP and phone via SMS',
          requiredDocuments: [],
          verificationMethod: 'automated',
          estimatedTimeDays: 0,
          autoCheck: true,
        },
        {
          id: 'us-business-reg',
          name: 'Business Registration',
          description: 'Verify EIN and business registration with state authority',
          requiredDocuments: ['business_registration'],
          verificationMethod: 'document_review',
          estimatedTimeDays: 1,
          externalService: 'IRS / State Secretary of State',
        },
        {
          id: 'us-import-license',
          name: 'Import License Verification',
          description: 'Verify CBP importer number and customs bond',
          requiredDocuments: ['import_license'],
          verificationMethod: 'api_check',
          estimatedTimeDays: 1,
          externalService: 'U.S. Customs and Border Protection (CBP)',
        },
        {
          id: 'us-physical-site',
          name: 'Physical Site Verification',
          description: 'Verify warehouse or business location',
          requiredDocuments: [],
          verificationMethod: 'physical_inspection',
          estimatedTimeDays: 3,
        },
        {
          id: 'us-bank-verification',
          name: 'Bank Account Verification',
          description: 'Verify bank account via Plaid or micro-deposit',
          requiredDocuments: ['bank_statement'],
          verificationMethod: 'micro_deposit',
          estimatedTimeDays: 2,
          externalService: 'Plaid / Stripe',
        },
        {
          id: 'us-trade-references',
          name: 'Trade References',
          description: 'Contact at least 2 previous suppliers for reference checks',
          requiredDocuments: [],
          verificationMethod: 'reference_check',
          estimatedTimeDays: 5,
        },
      ],
    });

    this.flows.set('US:distributor', {
      countryCode: 'US',
      orgType: 'distributor',
      minimumVerificationLevel: 'business_registration',
      steps: [
        {
          id: 'us-dist-email-phone',
          name: 'Email and Phone Verification',
          description: 'Verify email via OTP and phone via SMS',
          requiredDocuments: [],
          verificationMethod: 'automated',
          estimatedTimeDays: 0,
          autoCheck: true,
        },
        {
          id: 'us-dist-business',
          name: 'Business Registration',
          description: 'Verify EIN and business registration',
          requiredDocuments: ['business_registration'],
          verificationMethod: 'document_review',
          estimatedTimeDays: 1,
        },
        {
          id: 'us-dist-physical',
          name: 'Physical Site Verification',
          description: 'Verify business location and warehousing capacity',
          requiredDocuments: [],
          verificationMethod: 'physical_inspection',
          estimatedTimeDays: 3,
        },
        {
          id: 'us-dist-bank',
          name: 'Bank Account Verification',
          description: 'Verify bank account ownership',
          requiredDocuments: ['bank_statement'],
          verificationMethod: 'micro_deposit',
          estimatedTimeDays: 2,
        },
      ],
    });
  }

  private levelIndex(level: string): number {
    const levels = ['none', 'email_phone', 'business_registration', 'physical_site', 'banking_verified', 'trade_references', 'fully_verified'];
    return levels.indexOf(level);
  }
}
