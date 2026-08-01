import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  orgId?: string;
}

@WebSocketGateway({
  namespace: 'messages',
  cors: { origin: '*' },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { token: string; userId: string; orgId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.userId = data.userId;
    client.orgId = data.orgId;
    this.logger.log(`Client authenticated: ${client.id} user=${data.userId}`);
    client.emit('authenticated', { success: true });
  }

  @SubscribeMessage('join_deal_room')
  async handleJoinRoom(
    @MessageBody() data: { dealId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomId = `deal:${data.dealId}`;
    await client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
    client.emit('joined_room', { dealId: data.dealId });

    // Send recent messages
    const messages = await this.messageRepo.find({
      where: { dealId: data.dealId, deletedAt: null },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    client.emit('message_history', { dealId: data.dealId, messages: messages.reverse() });
  }

  @SubscribeMessage('leave_deal_room')
  handleLeaveRoom(
    @MessageBody() data: { dealId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomId = `deal:${data.dealId}`;
    client.leave(roomId);
    this.logger.log(`Client ${client.id} left room ${roomId}`);
    client.emit('left_room', { dealId: data.dealId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { dealId: string; content: string; messageType?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const message = this.messageRepo.create({
      dealId: data.dealId,
      senderUserId: client.userId,
      senderOrgId: client.orgId,
      content: data.content,
      messageType: data.messageType || 'text',
      status: 'sent',
    });

    const saved = await this.messageRepo.save(message);

    const roomId = `deal:${data.dealId}`;
    this.server.to(roomId).emit('new_message', {
      id: saved.id,
      dealId: saved.dealId,
      senderUserId: saved.senderUserId,
      senderOrgId: saved.senderOrgId,
      content: saved.content,
      messageType: saved.messageType,
      status: saved.status,
      createdAt: saved.createdAt,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { dealId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;
    const roomId = `deal:${data.dealId}`;
    client.to(roomId).emit('user_typing', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await this.messageRepo.update(data.messageId, { status: 'read', readAt: new Date() });
    client.emit('message_read', { messageId: data.messageId });
  }
}
