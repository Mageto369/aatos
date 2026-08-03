import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';

export interface FlutterwaveInitiatePayload {
  tx_ref: string;
  amount: string;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    name: string;
    phonenumber?: string;
  };
  meta?: Record<string, string>;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
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
    customer: {
      id: number;
      name: string;
      phone_number: string | null;
      email: string;
      created_at: string;
    };
    card?: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      token: string;
      expiry: string;
    };
  };
}

@Injectable()
export class FlutterwaveService {
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

  /**
   * Initiate a standard payment via Flutterwave hosted checkout
   */
  async initiatePayment(payload: FlutterwaveInitiatePayload): Promise<{ link: string | null; error?: string }> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Flutterwave payment initiated: ${payload.tx_ref} for ${payload.amount} ${payload.currency}`);
      return {
        link: `https://sandbox.flutterwave.com/pay/${payload.tx_ref}`,
      };
    }

    try {
      const body = JSON.stringify(payload);
      const response = await this.httpPost(`${this.baseUrl}/payments`, body);

      if (response.status === 'success' && response.data?.link) {
        return { link: response.data.link };
      }

      return {
        link: null,
        error: response.message || 'Failed to initiate payment',
      };
    } catch (err) {
      this.logger.error(`Flutterwave initiate failed: ${err.message}`);
      return { link: null, error: err.message };
    }
  }

  /**
   * Verify a transaction by its Flutterwave transaction ID
   */
  async verifyTransaction(transactionId: string): Promise<FlutterwaveVerifyResponse | null> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Flutterwave verify transaction: ${transactionId}`);
      return {
        status: 'success',
        message: 'Transaction fetched successfully',
        data: {
          id: parseInt(transactionId) || 123456,
          tx_ref: 'simulated-ref',
          flw_ref: 'FLW-MOCK-123456',
          amount: 1000,
          currency: 'USD',
          charged_amount: 1000,
          app_fee: 10,
          merchant_fee: 0,
          processor_response: 'successful',
          auth_model: 'PIN',
          ip: '127.0.0.1',
          narration: 'AATOS Trade Payment',
          status: 'successful',
          payment_type: 'card',
          created_at: new Date().toISOString(),
          account_id: 12345,
          customer: {
            id: 1,
            name: 'Test Buyer',
            phone_number: null,
            email: 'buyer@example.com',
            created_at: new Date().toISOString(),
          },
        },
      };
    }

    try {
      const response = await this.httpGet(`${this.baseUrl}/transactions/${transactionId}/verify`);
      return response as FlutterwaveVerifyResponse;
    } catch (err) {
      this.logger.error(`Flutterwave verify failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Verify a transaction by tx_ref (our internal reference)
   */
  async verifyByTxRef(txRef: string): Promise<FlutterwaveVerifyResponse | null> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Flutterwave verify by tx_ref: ${txRef}`);
      return this.verifyTransaction('123456');
    }

    try {
      // Query transactions by tx_ref
      const response = await this.httpGet(
        `${this.baseUrl}/transactions?tx_ref=${encodeURIComponent(txRef)}`,
      );
      if (response.status === 'success' && response.data?.length > 0) {
        const tx = response.data[0];
        return this.verifyTransaction(tx.id.toString());
      }
      return null;
    } catch (err) {
      this.logger.error(`Flutterwave verify by tx_ref failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Initiate a split payment for milestone tracking
   * NOTE: This is NOT escrow. AATOS does not custody customer funds.
   * Split payments are processed by the licensed payment provider.
   * AATOS tracks payment milestones, statuses, and release conditions only.
   */
  async initiateSplitPayment(payload: FlutterwaveInitiatePayload & {
    subaccounts?: Array<{ id: string; transaction_split_ratio: number }>;
  }): Promise<{ link: string | null; error?: string }> {
    // Payment split is handled by the licensed provider (Flutterwave subaccounts).
    // AATOS does not hold funds. We track milestone status only.
    return this.initiatePayment(payload);
  }

  /**
   * Initiate a refund
   */
  async refundTransaction(transactionId: string, amount?: number): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Flutterwave refund: ${transactionId}`);
      return true;
    }

    try {
      const body = JSON.stringify({ amount: amount ? amount.toString() : undefined });
      const response = await this.httpPost(`${this.baseUrl}/transactions/${transactionId}/refund`, body);
      return response.status === 'success';
    } catch (err) {
      this.logger.error(`Flutterwave refund failed: ${err.message}`);
      return false;
    }
  }

  private httpPost(url: string, body: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = httpsRequest(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ status: 'error', message: data });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(body);
      req.end();
    });
  }

  private httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      };

      const req = httpsRequest(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ status: 'error', message: data });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.end();
    });
  }
}
