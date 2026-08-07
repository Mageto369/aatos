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
import { Notification } from './entities/notification.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  orgId?: string;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'], credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly jwtSecret: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {
    this.jwtSecret = this.config.get<string>('JWT_SECRET', '');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Notification client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!this.jwtSecret) {
        client.emit('error', { message: 'Server misconfiguration' });
        return;
      }
      const payload = verify(data.token, this.jwtSecret, {
        issuer: 'aatos-api',
        audience: 'aatos-client',
      }) as JWTPayload;

      client.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Notification client authenticated: ${client.id} user=${payload.sub}`);
      client.emit('authenticated', { success: true, userId: payload.sub });
    } catch (err) {
      this.logger.warn(`Notification auth failed: ${err.message}`);
      client.emit('error', { message: 'Invalid token' });
    }
  }

  /**
   * Push a notification to a specific user in real-time
   */
  async pushNotification(userId: string, notification: Partial<Notification>): Promise<void> {
    const room = `user:${userId}`;
    this.server.to(room).emit('new_notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      actionUrl: notification.actionUrl,
      entityType: notification.entityType,
      entityId: notification.entityId,
      createdAt: notification.createdAt || new Date().toISOString(),
    });
    this.logger.debug(`Pushed notification to user ${userId}`);
  }

  /**
   * Push unread count update to a user
   */
  async pushUnreadCount(userId: string, count: number): Promise<void> {
    const room = `user:${userId}`;
    this.server.to(room).emit('unread_count', { count });
  }
}
