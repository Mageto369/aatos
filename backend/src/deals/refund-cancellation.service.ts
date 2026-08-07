import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProviderRegistry } from '../payments/payment-provider.registry';

import { Deal } from './entities/deal.entity';
import { Payment } from '../payments/entities/payment.entity';

export interface CancellationRequest {
  id: string;
  dealId: string;
  requestedBy: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  refundAmount: number;
  refundCurrency: string;
  approvedBy?: string;
  approvedAt?: Date;
  refundTransactionId?: string;
  createdAt: Date;
}

export interface RefundRequest {
  id: string;
  paymentId: string;
  dealId: string;
  requestedBy: string;
  reason: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  providerRefundId?: string;
  processedAt?: Date;
  createdAt: Date;
}

/**
 * Refund and Cancellation Service
 * Manages deal cancellations and payment refunds.
 */
@Injectable()
export class RefundCancellationService {
  private readonly logger = new Logger(RefundCancellationService.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly providerRegistry: PaymentProviderRegistry,
  ) {}

  async requestCancellation(data: {
    dealId: string;
    requestedBy: string;
    reason: string;
  }): Promise<CancellationRequest> {
    const deal = await this.dealRepo.findOne({ where: { id: data.dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    // Check if deal can be cancelled
    if (['completed', 'cancelled', 'disputed'].includes(deal.status)) {
      throw new BadRequestException(`Cannot cancel deal in status: ${deal.status}`);
    }

    // Calculate refund amount based on deal progress
    const refundAmount = this.calculateRefundAmount(deal);

    const cancellation: CancellationRequest = {
      id: crypto.randomUUID(),
      dealId: data.dealId,
      requestedBy: data.requestedBy,
      reason: data.reason,
      status: 'pending',
      refundAmount,
      refundCurrency: deal.priceCurrency,
      createdAt: new Date(),
    };

    this.logger.log(`Cancellation requested: ${cancellation.id} for deal ${data.dealId}`);
    return cancellation;
  }

  async approveCancellation(cancellationId: string, approvedBy: string): Promise<CancellationRequest> {
    // In production, persist to database
    const cancellation: CancellationRequest = {
      id: cancellationId,
      dealId: '',
      requestedBy: '',
      reason: '',
      status: 'approved',
      refundAmount: 0,
      refundCurrency: 'USD',
      approvedBy,
      approvedAt: new Date(),
      createdAt: new Date(),
    };

    // Process refund if applicable
    if (cancellation.refundAmount > 0) {
      const refund = await this.processRefund({
        dealId: cancellation.dealId,
        amount: cancellation.refundAmount,
        currency: cancellation.refundCurrency,
        reason: `Cancellation: ${cancellation.reason}`,
        requestedBy: cancellation.requestedBy,
      });
      cancellation.refundTransactionId = refund.providerRefundId;
    }

    // Update deal status
    await this.dealRepo.update(cancellation.dealId, { status: 'cancelled' });

    this.logger.log(`Cancellation approved: ${cancellationId} by ${approvedBy}`);
    return cancellation;
  }

  async processRefund(data: {
    dealId: string;
    amount: number;
    currency: string;
    reason: string;
    requestedBy: string;
  }): Promise<RefundRequest> {
    const payment = await this.paymentRepo.findOne({
      where: { dealId: data.dealId, status: 'held' },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new BadRequestException('No completed payment found for refund');
    }

    const provider = payment.externalProvider ? this.providerRegistry.get(payment.externalProvider) : undefined;
    if (!provider || !provider.refundPayment) {
      throw new BadRequestException('Refund not supported for this payment method');
    }
    const refundResult = await provider.refundPayment(payment.externalReference || '', data.amount);

    const refund: RefundRequest = {
      id: crypto.randomUUID(),
      paymentId: payment.id,
      dealId: data.dealId,
      requestedBy: data.requestedBy,
      reason: data.reason,
      amount: data.amount,
      currency: data.currency,
      status: refundResult.success ? 'completed' : 'failed',
      providerRefundId: refundResult.refundId,
      processedAt: new Date(),
      createdAt: new Date(),
    };

    this.logger.log(`Refund processed: ${refund.id} for payment ${payment.id}`);
    return refund;
  }

  private calculateRefundAmount(deal: any): number {
    // Refund policy:
    // - If no milestones completed: 100% refund minus processing fee (2%)
    // - If 1-2 milestones completed: 75% refund
    // - If 3-4 milestones completed: 50% refund
    // - If 5+ milestones completed: 25% refund
    // - If deal completed: 0% refund

    const completedMilestones = deal.milestones?.filter((m: any) => m.status === 'completed').length || 0;

    if (completedMilestones === 0) return deal.totalValue * 0.98;
    if (completedMilestones <= 2) return deal.totalValue * 0.75;
    if (completedMilestones <= 4) return deal.totalValue * 0.50;
    return deal.totalValue * 0.25;
  }
}
