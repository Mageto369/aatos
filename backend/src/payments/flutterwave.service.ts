import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  PaymentProvider,
  InitiatePaymentParams,
  PaymentInitiationResult,
  PaymentResult,
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

/** Why a webhook signature check failed. Safe to log — none of these name the secret. */
export type WebhookRejectionReason =
  | 'secret_not_configured'
  | 'missing_signature'
  | 'signature_mismatch';

export type WebhookSignatureCheck =
  | { valid: true }
  | { valid: false; reason: WebhookRejectionReason };

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
  /**
   * The shared secret Flutterwave echoes back in the `verif-hash` header.
   * Private and never logged: it is the only thing standing between the public
   * webhook route and arbitrary payment-state changes.
   */
  private readonly webhookHash: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('FLUTTERWAVE_SECRET_KEY', '');
    this.publicKey = this.config.get<string>('FLUTTERWAVE_PUBLIC_KEY', '');
    this.isTestMode = this.config.get<string>('FLUTTERWAVE_ENV', 'test') === 'test';
    this.webhookHash = this.config.get<string>('FLUTTERWAVE_WEBHOOK_HASH', '');

    const isProduction = this.config.get('NODE_ENV') === 'production';

    if (!this.secretKey && isProduction) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is required in production. Set it or disable payments.');
    }

    // POST /webhooks/flutterwave is @Public() by necessity — a provider cannot
    // present a JWT — so the signature is its only authentication. Booting
    // without the hash would leave an unauthenticated route that advances
    // payment state, so refuse to start rather than serve it.
    if (!this.webhookHash && isProduction) {
      throw new Error(
        'FLUTTERWAVE_WEBHOOK_HASH is required in production. Without it the public ' +
          'webhook route cannot be authenticated. Set it or disable payments.',
      );
    }

    if (!this.secretKey) {
      this.logger.warn('FLUTTERWAVE_SECRET_KEY not configured. Payments will be simulated.');
    }

    if (!this.webhookHash) {
      this.logger.warn(
        'FLUTTERWAVE_WEBHOOK_HASH not configured. Flutterwave webhooks cannot be ' +
          'verified and will be refused.',
      );
    }
  }

  get isConfigured(): boolean {
    return !!this.secretKey;
  }

  /** Whether the endpoint has a secret to verify deliveries against. */
  get isWebhookVerificationConfigured(): boolean {
    return !!this.webhookHash;
  }

  /**
   * Check the `verif-hash` header Flutterwave sends against the configured
   * secret hash.
   *
   * The comparison runs over SHA-256 digests of both values rather than the
   * raw strings: `timingSafeEqual` throws on length mismatch (which would leak
   * the secret's length), and digests are always 32 bytes. A plain `===` would
   * leak the secret one byte at a time to anyone able to time the endpoint.
   */
  verifyWebhookSignature(signature?: string | null): WebhookSignatureCheck {
    if (!this.webhookHash) {
      return { valid: false, reason: 'secret_not_configured' };
    }
    if (!signature) {
      return { valid: false, reason: 'missing_signature' };
    }
    if (!this.timingSafeEquals(signature, this.webhookHash)) {
      return { valid: false, reason: 'signature_mismatch' };
    }
    return { valid: true };
  }

  private timingSafeEquals(a: string, b: string): boolean {
    const left = createHash('sha256').update(a, 'utf8').digest();
    const right = createHash('sha256').update(b, 'utf8').digest();
    return timingSafeEqual(left, right);
  }

  /**
   * Stable identifier for a delivery, used as the idempotency key.
   *
   * Flutterwave has no dedicated delivery-id header, so this keys on the
   * transaction id the payload carries, scoped by event type (the same
   * transaction legitimately produces both a charge and a transfer event).
   * A payload with no usable id falls back to a digest of its own content, so
   * a byte-identical retry still collides with the original.
   */
  resolveWebhookEventId(payload: Record<string, any> | null | undefined): string {
    const body = payload ?? {};
    const data = (body.data ?? {}) as Record<string, any>;
    const event = String(body.event ?? body['event.type'] ?? 'unknown');

    const candidates = [body.id, data.id, data.flw_ref, data.tx_ref];
    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) continue;
      const value = String(candidate);
      if (value.length > 0) return `${event}:${value}`.slice(0, 255);
    }

    const digest = createHash('sha256').update(JSON.stringify(body)).digest('hex');
    return `${event}:sha256:${digest}`.slice(0, 255);
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

  async verifyPayment(txRef: string): Promise<PaymentResult> {
    if (!this.isConfigured) {
      return { success: true, transactionId: txRef, status: 'completed', providerRef: txRef, amount: 1000, currency: 'USD', message: 'Mock verification' };
    }

    try {
      const response = await this.httpGet(`${this.baseUrl}/transactions?tx_ref=${encodeURIComponent(txRef)}`);
      if (response.status === 'success' && response.data?.length > 0) {
        const tx = response.data[0];
        const verify = await this.httpGet(`${this.baseUrl}/transactions/${tx.id}/verify`);
        const d = verify.data;
        return {
          success: d.status === 'successful',
          transactionId: txRef,
          status: d.status === 'successful' ? 'completed' : d.status === 'pending' ? 'pending' : 'failed',
          providerRef: d.id?.toString() || txRef,
          amount: d.amount || 0,
          currency: d.currency || 'USD',
          message: d.processor_response || 'Payment verified',
          metadata: d.meta,
        };
      }
      return { success: false, transactionId: txRef, status: 'failed', providerRef: txRef, amount: 0, currency: 'USD', message: 'Transaction not found' };
    } catch (err: any) {
      this.logger.error(`Flutterwave verify failed: ${err.message}`);
      return { success: false, transactionId: txRef, status: 'failed', providerRef: txRef, amount: 0, currency: 'USD', message: err.message };
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
      const expected = createHmac('sha256', this.secretKey)
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
