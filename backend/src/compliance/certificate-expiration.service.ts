import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

export interface ExpiringCertificate {
  documentId: string;
  organizationId: string;
  organizationName: string;
  documentType: string;
  title: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  primaryContactEmail?: string;
}

/**
 * Certificate Expiration Tracking Service
 * Monitors document expiry dates and sends notifications.
 */
@Injectable()
export class CertificateExpirationService {
  private readonly logger = new Logger(CertificateExpirationService.name);

  constructor(
    @InjectRepository('documents')
    private readonly documentRepo: Repository<any>,
  ) {}

  /**
   * Find all certificates expiring within the given days
   */
  async findExpiringCertificates(days: number = 30): Promise<ExpiringCertificate[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const documents = await this.documentRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.organization', 'o')
      .where('d.deleted_at IS NULL')
      .andWhere('d.expiry_date IS NOT NULL')
      .andWhere('d.expiry_date <= :cutoff', { cutoff: cutoffDate })
      .andWhere('d.status IN (:...statuses)', { statuses: ['verified', 'uploaded'] })
      .getMany();

    return documents.map((doc: any) => ({
      documentId: doc.id,
      organizationId: doc.organizationId,
      organizationName: doc.organization?.name || 'Unknown',
      documentType: doc.type,
      title: doc.title,
      expiryDate: doc.expiryDate,
      daysUntilExpiry: Math.ceil((doc.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      primaryContactEmail: doc.organization?.primaryContactUser?.email,
    }));
  }

  /**
   * Find certificates that have already expired
   */
  async findExpiredCertificates(): Promise<ExpiringCertificate[]> {
    const documents = await this.documentRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.organization', 'o')
      .where('d.deleted_at IS NULL')
      .andWhere('d.expiry_date IS NOT NULL')
      .andWhere('d.expiry_date < CURRENT_DATE')
      .andWhere('d.status IN (:...statuses)', { statuses: ['verified', 'uploaded'] })
      .getMany();

    return documents.map((doc: any) => ({
      documentId: doc.id,
      organizationId: doc.organizationId,
      organizationName: doc.organization?.name || 'Unknown',
      documentType: doc.type,
      title: doc.title,
      expiryDate: doc.expiryDate,
      daysUntilExpiry: Math.floor((Date.now() - doc.expiryDate.getTime()) / (1000 * 60 * 60 * 24)) * -1,
      primaryContactEmail: doc.organization?.primaryContactUser?.email,
    }));
  }

  /**
   * Generate notifications for expiring certificates
   */
  async generateExpiryNotifications(): Promise<Array<{
    recipientEmail: string;
    subject: string;
    body: string;
    documentId: string;
  }>> {
    const expiring = await this.findExpiringCertificates(30);
    const notifications = [];

    for (const cert of expiring) {
      if (!cert.primaryContactEmail) continue;

      const urgency = cert.daysUntilExpiry <= 7 ? 'URGENT' : cert.daysUntilExpiry <= 14 ? 'WARNING' : 'NOTICE';

      notifications.push({
        recipientEmail: cert.primaryContactEmail,
        subject: `${urgency}: Certificate expiring in ${cert.daysUntilExpiry} days — ${cert.title}`,
        body: `Dear Partner,

Your ${cert.documentType} certificate "${cert.title}" is expiring on ${cert.expiryDate.toISOString().split('T')[0]} (${cert.daysUntilExpiry} days remaining).

Please renew this certificate and upload the updated document to maintain your verified status on AATOS.

Best regards,
AATOS Compliance Team`,
        documentId: cert.documentId,
      });
    }

    return notifications;
  }

  /**
   * Check if an organization has any expired critical certificates
   */
  async hasExpiredCriticalCertificates(orgId: string): Promise<boolean> {
    const criticalTypes = ['business_registration', 'export_license', 'import_license', 'phytosanitary_certificate'];
    const count = await this.documentRepo.count({
      where: {
        organizationId: orgId,
        type: criticalTypes as any,
        expiryDate: LessThan(new Date()),
        status: 'verified' as any,
        deletedAt: null,
      },
    });
    return count > 0;
  }
}
