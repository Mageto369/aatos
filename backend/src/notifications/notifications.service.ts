import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const notif = this.notifRepo.create(data);
    return this.notifRepo.save(notif);
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
    const unreadCount = await this.notifRepo.count({
      where: { recipientUserId: userId, isRead: false, isArchived: false },
    });

    return { items, total, unreadCount };
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({
      where: { id, recipientUserId: userId },
    });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    notif.isRead = true;
    notif.readAt = new Date();
    return this.notifRepo.save(notif);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update(
      { recipientUserId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
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
}
