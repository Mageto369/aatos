import { Injectable } from '@nestjs/common';

/**
 * Payment Provider Interface
 * All payment providers must implement this interface.
 * AATOS does not custody funds. Providers handle actual money movement.
 */
export interface PaymentProvider {
  readonly name: string;
  readonly supportedCurrencies: string[];
  readonly supportsEscrow: boolean;

  initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult>;
  verifyPayment(txRef: string): Promise<PaymentVerificationResult>;
  initiatePayout?(params: PayoutParams): Promise<PayoutResult>;
  handleWebhook?(payload: unknown, signature?: string): Promise<WebhookResult>;
}

export interface InitiatePaymentParams {
  txRef: string;
  amount: string;
  currency: string;
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
  meta?: Record<string, string>;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

export interface PaymentInitiationResult {
  link: string | null;
  txRef: string;
  providerReference?: string;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'successful' | 'pending' | 'failed' | 'unknown';
  amount?: number;
  currency?: string;
  chargedAmount?: number;
  appFee?: number;
  processorResponse?: string;
  customerEmail?: string;
  customerName?: string;
  paidAt?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface PayoutParams {
  recipientAccount: string;
  recipientBankCode?: string;
  amount: number;
  currency: string;
  reference: string;
  narration?: string;
}

export interface PayoutResult {
  success: boolean;
  transferId?: string;
  status?: string;
  error?: string;
}

export interface WebhookResult {
  event: 'payment.success' | 'payment.failure' | 'transfer.completed' | 'transfer.failed' | 'unknown';
  txRef: string;
  data: Record<string, unknown>;
  verified: boolean;
}
