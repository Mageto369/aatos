import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gateway: NotificationsGateway,
    private readonly emailService: EmailService,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const notif = this.notifRepo.create(data);
    const saved = await this.notifRepo.save(notif);

    // Push real-time notification
    if (saved.recipientUserId) {
      this.gateway.pushNotification(saved.recipientUserId, saved).catch(err =>
        this.logger.error(`Failed to push notification: ${err.message}`),
      );

      // Update unread count
      const unreadCount = await this.getUnreadCount(saved.recipientUserId);
      this.gateway.pushUnreadCount(saved.recipientUserId, unreadCount).catch(err =>
        this.logger.error(`Failed to push unread count: ${err.message}`),
      );

      // Send email if channel includes email
      if (saved.channels?.includes('email')) {
        this.sendEmailNotification(saved).catch(err =>
          this.logger.error(`Failed to send email: ${err.message}`),
        );
      }
    }

    return saved;
  }

  async findAll(userId: string, options: { unreadOnly?: boolean; limit?: number; offset?: number }) {
    const qb = this.notifRepo.createQueryBuilder('n')
      .where('n.recipientUserId = :userId', { userId })
      .andWhere('n.isArchived = false');

    if (options.unreadOnly) {
      qb.andWhere('n.isRead = false');
    }

    qb.orderBy('n.createdAt', 'DESC');
    qb.take(Math.min(options.limit || 20, 100));
    qb.skip(options.offset || 0);

    const [items, total] = await qb.getManyAndCount();
    const unreadCount = await this.getUnreadCount(userId);

    return { items, total, unreadCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({
      where: { recipientUserId: userId, isRead: false, isArchived: false },
    });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({
      where: { id, recipientUserId: userId },
    });
    if (!notif) throw new NotFoundException('Notification not found');

    notif.isRead = true;
    notif.readAt = new Date();
    const saved = await this.notifRepo.save(notif);

    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.pushUnreadCount(userId, unreadCount).catch(() => {});

    return saved;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update(
      { recipientUserId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    this.gateway.pushUnreadCount(userId, 0).catch(() => {});
  }

  async dismiss(id: string, userId: string): Promise<void> {
    await this.notifRepo.update(
      { id, recipientUserId: userId },
      { isArchived: true },
    );
  }

  async cleanupOld(days: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const result = await this.notifRepo.softDelete({
      createdAt: LessThan(cutoff),
    });
    return result.affected || 0;
  }

  private async sendEmailNotification(notif: Notification): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: notif.recipientUserId },
      select: ['id', 'email', 'emailVerified', 'firstName'],
    });

    if (!user || !user.email) {
      this.logger.warn(`Cannot send email notification ${notif.id}: user ${notif.recipientUserId} not found or no email`);
      return;
    }

    if (!user.emailVerified) {
      this.logger.debug(`Skipping email to unverified address: ${user.email}`);
      return;
    }

    const recipientEmail = user.email;
    const firstName = user.firstName || 'there';

    await this.emailService.send({
      to: recipientEmail,
      subject: notif.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">${notif.title}</h2>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${firstName},</p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">${notif.body}</p>
          ${notif.actionUrl ? `<a href="https://aatos.trade${notif.actionUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View in AATOS</a>` : ''}
          <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e5e5;" />
          <p style="color: #9a9a9a; font-size: 12px;">AATOS - African Agricultural Trade Operating System</p>
        </div>
      `,
      text: `${notif.title}\n\nHi ${firstName},\n\n${notif.body}\n\n${notif.actionUrl ? `View: https://aatos.trade${notif.actionUrl}` : ''}`,
    });
  }
}
