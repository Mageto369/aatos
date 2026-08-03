import { Injectable, Logger } from '@nestjs/common';

export interface Notification {
  id: string;
  recipientId: string;
  recipientEmail: string;
  type: 'rfq_response' | 'quote_deadline' | 'milestone_due' | 'payment_received' | 'document_expiry' | 'dispute_update' | 'compliance_alert';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject: string;
  body: string;
  data: Record<string, unknown>;
  sentAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'read';
}

export interface EscalationRule {
  id: string;
  eventType: Notification['type'];
  condition: string;
  delayMinutes: number;
  escalateTo: string[];
  messageTemplate: string;
}

/**
 * Notification Service
 * Handles email notifications, in-app notifications, and escalation rules.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notifications: Map<string, Notification> = new Map();
  private readonly escalationRules: EscalationRule[] = [];

  constructor() {
    this.initializeEscalationRules();
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'status'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      status: 'pending',
    };

    this.notifications.set(newNotification.id, newNotification);

    // Simulate sending
    try {
      await this.deliverNotification(newNotification);
      newNotification.status = 'sent';
      newNotification.sentAt = new Date();
      this.logger.log(`Notification sent: ${newNotification.id} to ${newNotification.recipientEmail}`);
    } catch (error) {
      newNotification.status = 'failed';
      this.logger.error(`Failed to send notification: ${newNotification.id}`, error);
    }

    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async sendBulkNotifications(notifications: Omit<Notification, 'id' | 'status'>[]): Promise<Notification[]> {
    return Promise.all(notifications.map(n => this.sendNotification(n)));
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = 'read';
      notification.readAt = new Date();
      this.notifications.set(notificationId, notification);
    }
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.recipientId === userId)
      .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0));
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.recipientId === userId && n.status !== 'read')
      .length;
  }

  /**
   * Check for notifications that need escalation
   */
  async checkEscalations(): Promise<Notification[]> {
    const escalated: Notification[] = [];
    const now = new Date();

    for (const rule of this.escalationRules) {
      const pendingNotifications = Array.from(this.notifications.values())
        .filter(n => n.type === rule.eventType && n.status === 'sent' && !n.readAt);

      for (const notification of pendingNotifications) {
        const elapsedMinutes = (now.getTime() - (notification.sentAt?.getTime() || 0)) / (1000 * 60);
        if (elapsedMinutes >= rule.delayMinutes) {
          for (const escalateTo of rule.escalateTo) {
            const escalation = await this.sendNotification({
              recipientId: escalateTo,
              recipientEmail: escalateTo, // Would look up actual email
              type: notification.type,
              priority: 'urgent',
              subject: `[ESCALATED] ${notification.subject}`,
              body: rule.messageTemplate.replace('{{originalSubject}}', notification.subject)
                .replace('{{recipientId}}', notification.recipientId)
                .replace('{{elapsedMinutes}}', String(Math.round(elapsedMinutes))),
              data: { originalNotificationId: notification.id, escalationRule: rule.id },
            });
            escalated.push(escalation);
          }
        }
      }
    }

    return escalated;
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    // In production, this would integrate with SendGrid, AWS SES, or similar
    this.logger.debug(`Delivering ${notification.type} notification to ${notification.recipientEmail}`);
    // Simulate async delivery
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private initializeEscalationRules(): void {
    this.escalationRules.push(
      {
        id: 'esc-rfq-001',
        eventType: 'rfq_response',
        condition: 'no_response_24h',
        delayMinutes: 1440, // 24 hours
        escalateTo: ['admin@aatos.trade'],
        messageTemplate: 'RFQ "{{originalSubject}}" has not received a response from {{recipientId}} for {{elapsedMinutes}} minutes.',
      },
      {
        id: 'esc-milestone-001',
        eventType: 'milestone_due',
        condition: 'overdue_48h',
        delayMinutes: 2880, // 48 hours
        escalateTo: ['compliance@aatos.trade', 'admin@aatos.trade'],
        messageTemplate: 'Milestone "{{originalSubject}}" is overdue by {{elapsedMinutes}} minutes.',
      },
      {
        id: 'esc-payment-001',
        eventType: 'payment_received',
        condition: 'dispute_raised',
        delayMinutes: 60, // 1 hour
        escalateTo: ['finance@aatos.trade'],
        messageTemplate: 'Payment dispute raised for "{{originalSubject}}".',
      },
    );
  }
}
