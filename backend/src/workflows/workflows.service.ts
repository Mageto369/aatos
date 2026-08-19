import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { RFQ } from '../rfqs/entities/rfq.entity';
import { Quotation } from '../rfqs/entities/quotation.entity';
import { Deal } from '../deals/entities/deal.entity';
import { DealMilestone } from '../deals/entities/deal-milestone.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ComplianceChecklist } from '../compliance/entities/compliance-checklist.entity';
import { Product } from '../products/entities/product.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(RFQ)
    private readonly rfqRepo: Repository<RFQ>,
    @InjectRepository(Quotation)
    private readonly quoteRepo: Repository<Quotation>,
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
    @InjectRepository(DealMilestone)
    private readonly milestoneRepo: Repository<DealMilestone>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(ComplianceChecklist)
    private readonly checklistRepo: Repository<ComplianceChecklist>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {}

  /**
   * Triggered when an RFQ is published.
   * Finds matching suppliers and sends notifications.
   */
  async onRfqPublished(rfqId: string): Promise<void> {
    const rfq = await this.rfqRepo.findOne({ where: { id: rfqId } });
    if (!rfq) return;

    // Find matching suppliers by product category and country
    const suppliers = await this.orgRepo
      .createQueryBuilder('o')
      .innerJoin('products', 'p', 'p.organization_id = o.id')
      .where('o.type IN (:...types)', { types: ['exporter', 'trader', 'cooperative', 'processor'] })
      .andWhere('o.verification_level IN (:...levels)', { levels: ['fully_verified', 'banking_verified', 'business_registration'] })
      .andWhere('p.category_id = :categoryId', { categoryId: rfq.productCategoryId })
      .andWhere('p.status = :status', { status: 'published' })
      .andWhere('o.deleted_at IS NULL')
      .andWhere('p.deleted_at IS NULL')
      .groupBy('o.id')
      .getMany();

    this.logger.log(`RFQ ${rfqId} published. Found ${suppliers.length} matching suppliers.`);

    // Send notifications to supplier members
    for (const supplier of suppliers) {
      const members = await this.memberRepo.find({
        where: { organizationId: supplier.id,  },
      });

      for (const member of members) {
        await this.notifRepo.save({
          recipientUserId: member.userId,
          recipientOrgId: supplier.id,
          type: 'rfq_match',
          title: 'New RFQ Match',
          body: `A new RFQ for ${rfq.title} matches your products. Click to view and submit a quote.`,
          actionUrl: `/rfqs/${rfqId}`,
          channels: ['in_app', 'email'],
        });
      }
    }

    // Update RFQ status
    rfq.status = 'matching';
    rfq.matchedSupplierCount = suppliers.length;
    await this.rfqRepo.save(rfq);
  }

  /**
   * Triggered when a quotation is accepted.
   * Creates a deal, milestones, compliance checklist, and initial payment.
   */
  async onQuoteAccepted(quoteId: string): Promise<Deal> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const quote = await this.quoteRepo.findOne({
        where: { id: quoteId },
      });
      if (!quote) throw new Error('Quote not found');

      const rfq = await this.rfqRepo.findOne({ where: { id: quote.rfqId } });
      if (!rfq) throw new Error('RFQ not found');

      // Create Deal
      const deal = this.dealRepo.create({
        buyerOrgId: rfq.buyerOrgId,
        supplierOrgId: quote.supplierOrgId,
        rfqId: rfq.id,
        winningQuotationId: quoteId,
        title: `${rfq.title} - Deal`,
        productCategoryId: rfq.productCategoryId,
        agreedQuantity: quote.quantityOffered,
        quantityUnit: quote.quantityUnit,
        agreedPrice: quote.unitPrice,
        priceCurrency: quote.priceCurrency,
        incoterm: quote.incoterm,
        paymentTerms: quote.paymentTerms || rfq.paymentTerms,
        status: 'negotiating',
        totalValueUsd: quote.totalPrice,
        platformFeeUsd: Number((quote.totalPrice * 0.01).toFixed(2)),
      });

      const savedDeal = await queryRunner.manager.save(deal);

      // Create Milestones
      const milestones = this.generateMilestones(savedDeal, quote);
      await queryRunner.manager.save(milestones);

      // Create Compliance Checklist placeholder
      // Origin selects which corridor's compliance rules apply, so an empty
      // string resolves to no rule set at all. It comes from the supplying
      // organization's registered country.
      const supplierOrg = await queryRunner.manager.findOne(Organization, {
        where: { id: quote.supplierOrgId },
      });

      const checklist = this.checklistRepo.create({
        entityType: 'deal',
        entityId: savedDeal.id,
        originCountry: supplierOrg?.countryCode ?? '',
        destinationCountry: rfq.destinationCountry,
        overallStatus: 'pending',
      });
      await queryRunner.manager.save(checklist);

      // Update deal with checklist reference
      savedDeal.complianceChecklistId = checklist.id;
      await queryRunner.manager.save(savedDeal);

      // Update RFQ status
      rfq.status = 'awarded';
      await queryRunner.manager.save(rfq);

      // Update quote status
      quote.status = 'accepted';
      await queryRunner.manager.save(quote);

      // Reject the losing quotes. This filtered on `id: quoteId` — the quote
      // just accepted — so it matched nothing and every losing quote stayed
      // 'sent', live in its supplier's pipeline against an awarded RFQ.
      await queryRunner.manager.update(
        Quotation,
        { rfqId: rfq.id, id: Not(quoteId), status: 'sent' },
        { status: 'rejected' },
      );

      // Create advance payment (if applicable)
      if (quote.paymentTerms?.toLowerCase().includes('advance') || quote.paymentTerms?.toLowerCase().includes('30%')) {
        const advancePayment = this.paymentRepo.create({
          dealId: savedDeal.id,
          payerOrgId: rfq.buyerOrgId,
          payeeOrgId: quote.supplierOrgId,
          amount: Number((quote.totalPrice * 0.3).toFixed(2)),
          currency: quote.priceCurrency,
          // Not 'escrow': AATOS does not custody funds and no escrow partner is
          // integrated (supportsEscrow is false on every provider). This record
          // is the 30% advance the quote's terms describe.
          paymentMethod: 'advance_payment',
          status: 'pending',
          releaseCondition: 'contract_signed',
        });
        await queryRunner.manager.save(advancePayment);
      }

      // Notify both parties
      await this.notifyDealCreated(savedDeal);

      await queryRunner.commitTransaction();
      this.logger.log(`Deal ${savedDeal.id} created from quote ${quoteId}`);
      return savedDeal;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create deal from quote ${quoteId}: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Triggered when a milestone is completed.
   * If payment milestone, creates/releases payment.
   */
  async onMilestoneCompleted(milestoneId: string): Promise<void> {
    const milestone = await this.milestoneRepo.findOne({
      where: { id: milestoneId },
      relations: ['deal'],
    });
    if (!milestone) return;

    const deal = milestone.deal;

    // Update deal status based on milestone type
    switch (milestone.milestoneType) {
      case 'contract_signing':
        deal.status = 'contract_signed';
        deal.contractSignedAt = new Date();
        // Release advance payment if held
        await this.releasePayment(deal.id, 'contract_signed');
        break;
      case 'inspection_completion':
        deal.status = 'inspection_passed';
        await this.releasePayment(deal.id, 'inspection_passed');
        break;
      case 'shipment_booking':
        deal.status = 'shipment_booked';
        break;
      case 'delivery_confirmation':
        deal.status = 'delivered';
        await this.releasePayment(deal.id, 'delivery_confirmed');
        break;
      case 'final_payment':
        deal.status = 'completed';
        deal.completedAt = new Date();
        break;
    }

    await this.dealRepo.save(deal);

    // Notify both parties
    await this.notifyMilestoneCompleted(milestone);
  }

  /**
   * Triggered when inspection is completed.
   */
  async onInspectionCompleted(inspectionId: string, result: string): Promise<void> {
    // Find related deal milestone
    const milestone = await this.milestoneRepo.findOne({
      where: { inspectionId },
      relations: ['deal'],
    });

    if (milestone && result === 'pass') {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
      await this.milestoneRepo.save(milestone);
      await this.onMilestoneCompleted(milestone.id);
    }

    // Notify parties
    if (milestone?.deal) {
      await this.notifyInspectionResult(milestone.deal, result);
    }
  }

  private generateMilestones(deal: Deal, quote: Quotation): DealMilestone[] {
    const milestones: Partial<DealMilestone>[] = [
      {
        dealId: deal.id,
        milestoneType: 'contract_signing',
        sequenceOrder: 1,
        status: 'pending',
        paymentPercentage: 0,
      },
      {
        dealId: deal.id,
        milestoneType: 'advance_payment',
        sequenceOrder: 2,
        status: 'pending',
        paymentPercentage: 30,
        paymentAmount: Number((quote.totalPrice * 0.3).toFixed(2)),
        paymentCurrency: quote.priceCurrency,
      },
      {
        dealId: deal.id,
        milestoneType: 'inspection_booking',
        sequenceOrder: 3,
        status: 'pending',
        paymentPercentage: 0,
      },
      {
        dealId: deal.id,
        milestoneType: 'inspection_completion',
        sequenceOrder: 4,
        status: 'pending',
        paymentPercentage: 0,
      },
      {
        dealId: deal.id,
        milestoneType: 'shipment_booking',
        sequenceOrder: 5,
        status: 'pending',
        paymentPercentage: 0,
      },
      {
        dealId: deal.id,
        milestoneType: 'main_payment',
        sequenceOrder: 6,
        status: 'pending',
        paymentPercentage: 60,
        paymentAmount: Number((quote.totalPrice * 0.6).toFixed(2)),
        paymentCurrency: quote.priceCurrency,
      },
      {
        dealId: deal.id,
        milestoneType: 'delivery_confirmation',
        sequenceOrder: 7,
        status: 'pending',
        paymentPercentage: 0,
      },
      {
        dealId: deal.id,
        milestoneType: 'final_payment',
        sequenceOrder: 8,
        status: 'pending',
        paymentPercentage: 10,
        paymentAmount: Number((quote.totalPrice * 0.1).toFixed(2)),
        paymentCurrency: quote.priceCurrency,
      },
    ];

    return milestones.map(m => this.milestoneRepo.create(m));
  }

  private async releasePayment(dealId: string, condition: string): Promise<void> {
    const payments = await this.paymentRepo.find({
      where: { dealId, status: 'held', releaseCondition: condition },
    });

    for (const payment of payments) {
      payment.status = 'released';
      payment.releasedAt = new Date();
      await this.paymentRepo.save(payment);

      this.logger.log(`Payment ${payment.id} released for deal ${dealId} on condition: ${condition}`);
    }
  }

  private async notifyDealCreated(deal: Deal): Promise<void> {
    const members = await this.memberRepo.find({
      where: [
        { organizationId: deal.buyerOrgId,  },
        { organizationId: deal.supplierOrgId,  },
      ],
    });

    for (const member of members) {
      await this.notifRepo.save({
        recipientUserId: member.userId,
        recipientOrgId: member.organizationId,
        type: 'deal_update',
        title: 'New Deal Created',
        body: `A new deal "${deal.title}" has been created. Value: $${deal.totalValueUsd?.toLocaleString()}.`,
        actionUrl: `/deals/${deal.id}`,
        entityType: 'deal',
        entityId: deal.id,
        channels: ['in_app', 'email'],
      });
    }
  }

  private async notifyMilestoneCompleted(milestone: DealMilestone): Promise<void> {
    const deal = await this.dealRepo.findOne({ where: { id: milestone.dealId } });
    if (!deal) return;

    const members = await this.memberRepo.find({
      where: [
        { organizationId: deal.buyerOrgId,  },
        { organizationId: deal.supplierOrgId,  },
      ],
    });

    for (const member of members) {
      await this.notifRepo.save({
        recipientUserId: member.userId,
        recipientOrgId: member.organizationId,
        type: 'milestone_due',
        title: 'Milestone Completed',
        body: `Milestone "${milestone.milestoneType.replace('_', ' ')}" for deal "${deal.title}" has been completed.`,
        actionUrl: `/deals/${deal.id}`,
        entityType: 'deal',
        entityId: deal.id,
        channels: ['in_app'],
      });
    }
  }

  private async notifyInspectionResult(deal: Deal, result: string): Promise<void> {
    const members = await this.memberRepo.find({
      where: [
        { organizationId: deal.buyerOrgId,  },
        { organizationId: deal.supplierOrgId,  },
      ],
    });

    const title = result === 'pass' ? 'Inspection Passed' : 'Inspection Failed';
    const body = result === 'pass'
      ? `The inspection for deal "${deal.title}" has passed. The deal can now proceed to shipment.`
      : `The inspection for deal "${deal.title}" has failed. Please review the findings and corrective actions required.`;

    for (const member of members) {
      await this.notifRepo.save({
        recipientUserId: member.userId,
        recipientOrgId: member.organizationId,
        type: 'deal_update',
        title,
        body,
        actionUrl: `/deals/${deal.id}`,
        entityType: 'deal',
        entityId: deal.id,
        channels: ['in_app', 'email'],
      });
    }
  }
}
