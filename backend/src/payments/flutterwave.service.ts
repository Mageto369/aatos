import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';
import {
  PaymentProvider,
  InitiatePaymentParams,
  PaymentInitiationResult,
  PaymentVerificationResult,
  PayoutParams,
  PayoutResult,
  WebhookResult,
} from './payment-provider.interface';

export interface FlutterwaveInitiatePayload {
  tx_ref: string;
  amount: string;
  currency: string;
  redirect_url: string;
  customer: { email: string; name: string; phonenumber?: string };
  meta?: Record<string, string>;
  customizations?: { title?: string; description?: string; logo?: string };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    meta?: Record<string, any>;
    customer: { id: number; name: string; phone_number: string | null; email: string; created_at: string };
    card?: { first_6digits: string; last_4digits: string; issuer: string; country: string; type: string; token: string; expiry: string };
  };
}

@Injectable()
export class FlutterwaveService implements PaymentProvider {
  readonly name = 'flutterwave';
  readonly supportedCurrencies = ['NGN', 'USD', 'EUR', 'GBP', 'KES', 'GHS', 'ZAR', 'TZS', 'UGX', 'XOF', 'XAF'];
  readonly supportsEscrow = false; // AATOS does not custody funds

  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly isTestMode: boolean;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('FLUTTERWAVE_SECRET_KEY', '');
    this.publicKey = this.config.get<string>('FLUTTERWAVE_PUBLIC_KEY', '');
    this.isTestMode = this.config.get<string>('FLUTTERWAVE_ENV', 'test') === 'test';

    if (!this.secretKey) {
      this.logger.warn('FLUTTERWAVE_SECRET_KEY not configured. Payments will be simulated.');
    }
  }

  get isConfigured(): boolean {
    return !!this.secretKey;
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Flutterwave payment: ${params.txRef}`);
      return { link: `https://sandbox.flutterwave.com/pay/${params.txRef}`, txRef: params.txRef };
    }

    const payload: FlutterwaveInitiatePayload = {
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: { email: params.customerEmail, name: params.customerName },
      meta: params.meta,
      customizations: params.customizations,
    };

    try {
      const body = JSON.stringify(payload);
      const response = await this.httpPost(`${this.baseUrl}/payments`, body);

      if (response.status === 'success' && response.data?.link) {
        return { link: response.data.link, txRef: params.txRef, providerReference: response.data.link };
      }

      return { link: null, txRef: params.txRef, error: response.message || 'Failed to initiate payment' };
    } catch (err: any) {
      this.logger.error(`Flutterwave initiate failed: ${err.message}`);
      return { link: null, txRef: params.txRef, error: err.message };
    }
  }

  async verifyPayment(txRef: string): Promise<PaymentVerificationResult> {
    if (!this.isConfigured) {
      return { success: true, status: 'successful', amount: 1000, currency: 'USD' };
    }

    try {
      const response = await this.httpGet(`${this.baseUrl}/transactions?tx_ref=${encodeURIComponent(txRef)}`);
      if (response.status === 'success' && response.data?.length > 0) {
        const tx = response.data[0];
        const verify = await this.httpGet(`${this.baseUrl}/transactions/${tx.id}/verify`);
        const d = verify.data;
        return {
          success: d.status === 'successful',
          status: d.status === 'successful' ? 'successful' : d.status === 'pending' ? 'pending' : 'failed',
          amount: d.amount,
          currency: d.currency,
          chargedAmount: d.charged_amount,
          appFee: d.app_fee,
          processorResponse: d.processor_response,
          customerEmail: d.customer?.email,
          customerName: d.customer?.name,
          paidAt: d.created_at,
          metadata: d.meta,
        };
      }
      return { success: false, status: 'unknown', error: 'Transaction not found' };
    } catch (err: any) {
      this.logger.error(`Flutterwave verify failed: ${err.message}`);
      return { success: false, status: 'unknown', error: err.message };
    }
  }

  async initiatePayout(params: PayoutParams): Promise<PayoutResult> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Flutterwave payout: ${params.reference}`);
      return { success: true, transferId: `SIM-${params.reference}` };
    }

    try {
      const body = JSON.stringify({
        account_bank: params.recipientBankCode,
        account_number: params.recipientAccount,
        amount: params.amount,
        currency: params.currency,
        reference: params.reference,
        narration: params.narration || 'AATOS Payout',
      });
      const response = await this.httpPost(`${this.baseUrl}/transfers`, body);
      return {
        success: response.status === 'success',
        transferId: response.data?.id?.toString(),
        status: response.data?.status,
        error: response.status !== 'success' ? response.message : undefined,
      };
    } catch (err: any) {
      this.logger.error(`Flutterwave payout failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async handleWebhook(payload: unknown, signature?: string): Promise<WebhookResult> {
    // Verify webhook signature if provided
    if (signature && this.secretKey) {
      const crypto = await import('node:crypto');
      const expected = crypto.createHmac('sha256', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (expected !== signature) {
        return { event: 'unknown', txRef: '', data: {}, verified: false };
      }
    }

    const p = payload as Record<string, any>;
    const event = p.event || p['event.type'] || '';
    const txRef = p.data?.tx_ref || p.data?.reference || '';

    if (event.includes('charge.completed') && p.data?.status === 'successful') {
      return { event: 'payment.success', txRef, data: p.data, verified: true };
    }
    if (event.includes('charge.completed') && p.data?.status !== 'successful') {
      return { event: 'payment.failure', txRef, data: p.data, verified: true };
    }
    if (event.includes('transfer.completed')) {
      return { event: 'transfer.completed', txRef, data: p.data, verified: true };
    }
    if (event.includes('transfer.failed')) {
      return { event: 'transfer.failed', txRef, data: p.data, verified: true };
    }

    return { event: 'unknown', txRef, data: p.data || {}, verified: true };
  }

  private httpPost(url: string, body: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const req = httpsRequest({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ status: 'error', message: data }); } });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const req = httpsRequest({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ status: 'error', message: data }); } });
      });
      req.on('error', reject);
      req.end();
    });
  }
}
