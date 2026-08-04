import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';

export interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('SENDGRID_API_KEY', '');
    this.fromEmail = this.config.get<string>('EMAIL_FROM', 'noreply@aatos.trade');
    this.fromName = this.config.get<string>('EMAIL_FROM_NAME', 'AATOS Platform');
    this.isConfigured = !!this.apiKey;

    if (!this.isConfigured) {
      this.logger.warn('SENDGRID_API_KEY not configured. Emails will be logged only.');
    }
  }

  async send(payload: SendEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      this.logger.log(`[EMAIL SIMULATED] To: ${payload.to} | Subject: ${payload.subject}`);
      if (payload.text) this.logger.log(`[EMAIL BODY] ${payload.text.slice(0, 200)}...`);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const body: any = {
      personalizations: [{
        to: [{ email: payload.to, name: payload.toName }],
      }],
      from: { email: this.fromEmail, name: this.fromName },
      subject: payload.subject,
    };

    if (payload.html) body.content = [{ type: 'text/html', value: payload.html }];
    else if (payload.text) body.content = [{ type: 'text/plain', value: payload.text }];

    if (payload.templateId) {
      body.template_id = payload.templateId;
      if (payload.dynamicTemplateData) {
        body.personalizations[0].dynamic_template_data = payload.dynamicTemplateData;
      }
    }

    if (payload.replyTo) body.reply_to = { email: payload.replyTo };

    try {
      const result = await this.httpPost('https://api.sendgrid.com/v3/mail/send', JSON.stringify(body));
      const messageId = result.headers?.['x-message-id'];
      this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`);
      return { success: true, messageId };
    } catch (err) {
      this.logger.error(`Failed to send email to ${payload.to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendBulk(payloads: SendEmailPayload[]): Promise<Array<{ success: boolean; error?: string }>> {
    return Promise.all(payloads.map(p => this.send(p).then(r => ({ success: r.success, error: r.error }))));
  }

  private httpPost(url: string, body: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = httpsRequest(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ headers: res.headers, body: data });
          } else {
            reject(new Error(`SendGrid API error ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(body);
      req.end();
    });
  }
}
