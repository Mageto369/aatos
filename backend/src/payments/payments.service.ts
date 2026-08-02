import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { FlutterwaveService } from './flutterwave.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly flutterwaveService: FlutterwaveService,
  ) {}

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepo.create(data);
    return this.paymentRepo.save(payment);
  }

  async findAll(filters: {
    dealId?: string;
    payerOrgId?: string;
    payeeOrgId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .where('p.deletedAt IS NULL');

    if (filters.dealId) qb.andWhere('p.dealId = :dealId', { dealId: filters.dealId });
    if (filters.payerOrgId) qb.andWhere('p.payerOrgId = :payerOrgId', { payerOrgId: filters.payerOrgId });
    if (filters.payeeOrgId) qb.andWhere('p.payeeOrgId = :payeeOrgId', { payeeOrgId: filters.payeeOrgId });
    if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });

    qb.orderBy('p.createdAt', 'DESC');
    qb.take(Math.min(filters.limit || 20, 100));
    qb.skip(filters.offset || 0);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id, deletedAt: null },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async updateStatus(id: string, status: string, data?: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = status as any;
    if (status === 'released') payment.releasedAt = new Date();
    if (data) Object.assign(payment, data);
    return this.paymentRepo.save(payment);
  }

  async getDealPayments(dealId: string) {
    return this.paymentRepo.find({
      where: { dealId, deletedAt: null },
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentSummary(dealId: string) {
    const payments = await this.paymentRepo.find({ where: { dealId, deletedAt: null } });
    return payments.reduce(
      (acc, p) => {
        const amount = Number(p.amountUsd || p.amount);
        if (p.status === 'released') acc.totalPaid += amount;
        else if (p.status === 'held') acc.totalHeld += amount;
        else if (p.status === 'pending') acc.totalPending += amount;
        return acc;
      },
      { totalPaid: 0, totalHeld: 0, totalPending: 0 },
    );
  }

  /**
   * Initiate a payment via Flutterwave
   */
  async initiateFlutterwavePayment(paymentId: string, redirectUrl: string): Promise<{ link: string | null; error?: string }> {
    const payment = await this.findOne(paymentId);

    const result = await this.flutterwaveService.initiatePayment({
      tx_ref: `AATOS-${payment.id}`,
      amount: payment.amount.toString(),
      currency: payment.currency,
      redirect_url: redirectUrl,
      customer: {
        email: 'buyer@aatos.trade', // Would come from user profile
        name: 'AATOS Buyer',
      },
      meta: {
        paymentId: payment.id,
        dealId: payment.dealId,
        milestoneId: payment.milestoneId || '',
      },
      customizations: {
        title: 'AATOS Trade Payment',
        description: `Payment for deal ${payment.dealId}`,
        logo: 'https://aatos.trade/logo.png',
      },
    });

    if (result.link) {
      payment.externalProvider = 'flutterwave';
      payment.externalReference = `AATOS-${payment.id}`;
      await this.paymentRepo.save(payment);
    }

    return result;
  }

  /**
   * Verify a payment via Flutterwave
   */
  async verifyFlutterwavePayment(paymentId: string): Promise<boolean> {
    const payment = await this.findOne(paymentId);
    if (!payment.externalReference) return false;

    const result = await this.flutterwaveService.verifyByTxRef(payment.externalReference);
    if (!result || result.data.status !== 'successful') return false;

    payment.status = 'held';
    payment.externalMetadata = {
      ...payment.externalMetadata,
      flutterwave: result.data,
    };
    payment.providerFeeAmount = result.data.app_fee;
    await this.paymentRepo.save(payment);
    return true;
  }

  /**
   * Handle successful payment webhook
   */
  async handlePaymentSuccess(txRef: string, data: {
    transactionId?: string;
    flwRef?: string;
    amount?: number;
    currency?: string;
    chargedAmount?: number;
    appFee?: number;
    paymentType?: string;
    processorResponse?: string;
    customerEmail?: string;
    customerName?: string;
    paidAt?: string;
  }): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { externalReference: txRef, deletedAt: null },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for tx_ref: ${txRef}`);
      return;
    }

    payment.status = 'held';
    payment.externalMetadata = {
      ...payment.externalMetadata,
      webhook: data,
    };
    payment.providerFeeAmount = data.appFee || 0;

    await this.paymentRepo.save(payment);
    this.logger.log(`Payment ${payment.id} confirmed and held. Amount: ${data.amount} ${data.currency}`);
  }

  /**
   * Handle failed payment webhook
   */
  async handlePaymentFailure(txRef: string, reason: string): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { externalReference: txRef, deletedAt: null },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for tx_ref: ${txRef}`);
      return;
    }

    payment.status = 'failed';
    payment.externalMetadata = {
      ...payment.externalMetadata,
      failureReason: reason,
    };

    await this.paymentRepo.save(payment);
    this.logger.warn(`Payment ${payment.id} failed: ${reason}`);
  }

  /**
   * Handle transfer/payout completed webhook
   */
  async handleTransferCompleted(txRef: string, data: { transferId?: string; status?: string; amount?: number }): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { externalReference: txRef, deletedAt: null },
    });

    if (!payment) return;

    if (data.status === 'SUCCESSFUL') {
      payment.status = 'released';
      payment.releasedAt = new Date();
    } else {
      payment.status = 'failed';
    }

    payment.externalMetadata = {
      ...payment.externalMetadata,
      transfer: data,
    };

    await this.paymentRepo.save(payment);
    this.logger.log(`Payment ${payment.id} transfer completed: ${data.status}`);
  }

  /**
   * Release held payment to payee (escrow release)
   */
  async releasePayment(paymentId: string, releasedBy: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.status !== 'held') {
      throw new Error(`Cannot release payment in status: ${payment.status}`);
    }

    // In production: trigger Flutterwave transfer to payee
    payment.status = 'released';
    payment.releasedAt = new Date();
    payment.releasedBy = releasedBy;

    return this.paymentRepo.save(payment);
  }
}
