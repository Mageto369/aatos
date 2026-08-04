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
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { verify } from 'jsonwebtoken';
import { Message } from './entities/message.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  orgId?: string;
  email?: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  orgId?: string;
}

@WebSocketGateway({
  namespace: 'messages',
  cors: { origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'], credentials: true },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagesGateway.name);
  private readonly jwtSecret: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {
    this.jwtSecret = this.config.get<string>('JWT_SECRET', '');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!this.jwtSecret) {
        this.logger.error('JWT_SECRET not configured');
        client.emit('error', { message: 'Server misconfiguration' });
        return;
      }
      const payload = verify(data.token, this.jwtSecret, {
        issuer: 'aatos-api',
        audience: 'aatos-client',
      }) as JWTPayload;

      client.userId = payload.sub;
      client.email = payload.email;
      // Note: orgId is not in JWT payload by default, would need to be added
      this.logger.log(`Client authenticated: ${client.id} user=${payload.sub}`);
      client.emit('authenticated', { success: true, userId: payload.sub });
    } catch (err) {
      this.logger.warn(`Auth failed for ${client.id}: ${err.message}`);
      client.emit('error', { message: 'Invalid token' });
    }
  }

  @SubscribeMessage('join_deal_room')
  async handleJoinRoom(
    @MessageBody() data: { dealId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }
    const roomId = `deal:${data.dealId}`;
    await client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
    client.emit('joined_room', { dealId: data.dealId });

    // Send recent messages
    const messages = await this.messageRepo.find({
      where: { dealId: data.dealId,  },
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
      senderOrgId: client.orgId || undefined,
      content: data.content,
      messageType: data.messageType || 'text',
    } as any);

    const saved = await this.messageRepo.save(message) as any;

    const roomId = `deal:${data.dealId}`;
    this.server.to(roomId).emit('new_message', {
      id: saved.id,
      dealId: saved.dealId,
      senderUserId: saved.senderUserId,
      senderOrgId: saved.senderOrgId,
      content: saved.content,
      messageType: saved.messageType,
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
}
