import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepo.create(data);
    return this.paymentRepo.save(payment);
  }

  async findAll(filters: { dealId?: string; payerOrgId?: string; payeeOrgId?: string; status?: string; limit?: number; offset?: number }) {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .where('p.deletedAt IS NULL');

    if (filters.dealId) {
      qb.andWhere('p.dealId = :dealId', { dealId: filters.dealId });
    }
    if (filters.payerOrgId) {
      qb.andWhere('p.payerOrgId = :payerOrgId', { payerOrgId: filters.payerOrgId });
    }
    if (filters.payeeOrgId) {
      qb.andWhere('p.payeeOrgId = :payeeOrgId', { payeeOrgId: filters.payeeOrgId });
    }
    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }

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
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }

  async updateStatus(id: string, status: string, data?: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = status as any;
    if (status === 'released') {
      payment.releasedAt = new Date();
    }
    if (data) {
      Object.assign(payment, data);
    }
    return this.paymentRepo.save(payment);
  }

  async getDealPayments(dealId: string) {
    return this.paymentRepo.find({
      where: { dealId, deletedAt: null },
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentSummary(dealId: string): Promise<{ totalPaid: number; totalHeld: number; totalPending: number }> {
    const payments = await this.paymentRepo.find({
      where: { dealId, deletedAt: null },
    });

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
}
