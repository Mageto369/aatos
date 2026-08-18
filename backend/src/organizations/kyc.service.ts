import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

export interface VerificationDocument {
  type: 'business_registration' | 'tax_certificate' | 'bank_statement' | 'identity_document' | 'physical_site_proof' | 'trade_reference';
  documentUrl: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface KycSubmission {
  documents: VerificationDocument[];
  submittedAt: Date;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
}

/**
 * KYC Service
 * Handles organization verification workflow.
 * For pilot: manual review by admin. Future: automated checks.
 */
@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async submitDocuments(orgId: string, documents: Omit<VerificationDocument, 'submittedAt' | 'status'>[]): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const kycDocs: VerificationDocument[] = documents.map(d => ({
      ...d,
      submittedAt: new Date(),
      status: 'pending',
    }));

    // Store documents in organization metadata (JSONB)
    const existingDocs = (org.metadata?.kycDocuments || []) as VerificationDocument[];
    org.metadata = {
      ...org.metadata,
      kycDocuments: [...existingDocs, ...kycDocs],
      kycSubmittedAt: new Date(),
      kycStatus: 'pending',
    };

    org.status = 'pending_verification';
    return this.orgRepo.save(org);
  }

  async reviewSubmission(
    orgId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    notes?: string,
    verificationLevel?: string,
  ): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const docs = (org.metadata?.kycDocuments || []) as VerificationDocument[];
    const updatedDocs = docs.map(d => ({
      ...d,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      status: decision,
      notes: notes || d.notes,
    }));

    org.metadata = {
      ...org.metadata,
      kycDocuments: updatedDocs,
      kycReviewedAt: new Date(),
      kycStatus: decision,
      kycReviewerId: reviewerId,
      kycNotes: notes,
    };

    org.status = decision === 'approved' ? 'verified' : 'rejected';
    if (verificationLevel) {
      org.verificationLevel = verificationLevel as any;
    }

    return this.orgRepo.save(org);
  }

  async getPendingReview(): Promise<Organization[]> {
    return this.orgRepo.find({
      where: { status: 'pending_verification' },
      order: { createdAt: 'ASC' },
    });
  }

  async getSubmission(orgId: string): Promise<KycSubmission | null> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org || !org.metadata?.kycDocuments) return null;

    return {
      documents: org.metadata.kycDocuments as VerificationDocument[],
      submittedAt: org.metadata.kycSubmittedAt as Date,
      status: (org.metadata.kycStatus as 'pending' | 'in_review' | 'approved' | 'rejected') || 'pending',
    };
  }
}
