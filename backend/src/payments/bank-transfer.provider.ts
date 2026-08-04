import { Injectable } from '@nestjs/common';
import { PaymentProvider, CreatePaymentInput, PaymentResult, RefundResult, InitiatePaymentParams, PaymentInitiationResult } from './payment-provider.interface';

export interface BankTransferDetails {
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountHolderName: string;
  swiftCode?: string;
  iban?: string;
}

export interface MobileMoneyDetails {
  phoneNumber: string;
  provider: 'mpesa' | 'mtn' | 'airtel' | 'vodafone';
  network: string;
}

/**
 * Bank Transfer Payment Provider
 * Handles bank transfer payments via integration with banking APIs.
 */
@Injectable()
export class BankTransferProvider implements PaymentProvider {
  readonly name = 'bank_transfer';
  readonly supportedCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'];
  readonly supportsEscrow = false;

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    return {
      link: null,
      txRef: params.txRef,
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const details = input.metadata?.bankDetails as BankTransferDetails;
    if (!details) {
      throw new Error('Bank transfer details required');
    }

    // In production, integrate with bank API (e.g., Mono, Plaid)
    return {
      success: true,
      transactionId: `BT-${Date.now()}`,
      status: 'pending',
      providerRef: `bt_${crypto.randomUUID()}`,
      amount: input.amount,
      currency: input.currency,
      message: 'Bank transfer initiated. Please complete transfer using provided details.',
      metadata: {
        bankName: details.bankName,
        accountNumber: details.accountNumber,
        swiftCode: details.swiftCode,
      },
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    // In production, check bank API for confirmation
    return {
      success: true,
      transactionId,
      status: 'completed',
      providerRef: transactionId,
      amount: 0,
      currency: 'USD',
      message: 'Bank transfer verified',
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `RF-${Date.now()}`,
      originalTransactionId: transactionId,
      amount: amount || 0,
      status: 'pending',
      message: 'Bank transfer refund initiated',
    };
  }

  async getTransactionStatus(transactionId: string): Promise<string> {
    // In production, query bank API
    return 'pending';
  }
}

/**
 * Mobile Money Payment Provider
 * Handles mobile money payments (M-Pesa, MTN Mobile Money, Airtel Money).
 */
@Injectable()
export class MobileMoneyProvider implements PaymentProvider {
  readonly name = 'mobile_money';
  readonly supportedCurrencies = ['NGN', 'KES', 'GHS', 'UGX', 'TZS', 'XOF', 'XAF'];
  readonly supportsEscrow = false;

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    return {
      link: null,
      txRef: params.txRef,
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const details = input.metadata?.mobileMoneyDetails as MobileMoneyDetails;
    if (!details) {
      throw new Error('Mobile money details required');
    }

    // In production, integrate with M-Pesa Daraja API, MTN MoMo API, etc.
    return {
      success: true,
      transactionId: `MM-${Date.now()}`,
      status: 'pending',
      providerRef: `mm_${crypto.randomUUID()}`,
      amount: input.amount,
      currency: input.currency,
      message: `Mobile money payment request sent to ${details.phoneNumber}. Please approve on your device.`,
      metadata: {
        phoneNumber: details.phoneNumber,
        provider: details.provider,
        network: details.network,
      },
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    // In production, query mobile money API
    return {
      success: true,
      transactionId,
      status: 'completed',
      providerRef: transactionId,
      amount: 0,
      currency: 'USD',
      message: 'Mobile money payment verified',
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `RF-${Date.now()}`,
      originalTransactionId: transactionId,
      amount: amount || 0,
      status: 'pending',
      message: 'Mobile money refund initiated',
    };
  }

  async getTransactionStatus(transactionId: string): Promise<string> {
    // In production, query mobile money API
    return 'pending';
  }
}
