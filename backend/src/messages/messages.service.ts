import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Deal } from '../deals/entities/deal.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
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

  /**
   * Whether an organization is a party to a deal.
   *
   * Deal-room messages are the private negotiation between exactly two
   * companies. GET /messages/deal/:dealId took the id from the path with no
   * caller at all, so any authenticated user could read any deal's messages.
   */
  async isPartyToDeal(dealId: string, orgId: string): Promise<boolean> {
    if (!orgId) return false;
    const deal = await this.dealRepo.findOne({
      where: { id: dealId },
      select: { id: true, buyerOrgId: true, supplierOrgId: true },
    });
    if (!deal) return false;
    return deal.buyerOrgId === orgId || deal.supplierOrgId === orgId;
  }

}
