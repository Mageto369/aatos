import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createMessage(senderOrgId: string, senderUserId: string, data: {
    dealId?: string;
    rfqId?: string;
    content: string;
    messageType?: string;
    attachmentDocumentId?: string;
  }): Promise<Message> {
    const message = this.messageRepo.create({
      ...data,
      senderOrgId,
      senderUserId,
      messageType: data.messageType || 'text',
    });
    return this.messageRepo.save(message);
  }

  async getDealMessages(dealId: string, cursor?: string, limit: number = 50): Promise<Message[]> {
    const qb = this.messageRepo.createQueryBuilder('m')
      .where('m.dealId = :dealId', { dealId })
      .andWhere('m.deletedAt IS NULL')
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (cursor) {
      const decodedCursor = new Date(Buffer.from(cursor, 'base64').toString());
      qb.andWhere('m.createdAt < :cursor', { cursor: decodedCursor });
    }

    return qb.getMany();
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const readBy = message.readBy || {};
    readBy[userId] = new Date().toISOString();

    await this.messageRepo.update(messageId, { readBy });
  }
}
