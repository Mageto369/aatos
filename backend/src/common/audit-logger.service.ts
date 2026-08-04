import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from './entities/audit-log.entity';

/**
 * Audit Log Entry
 * Immutable record of significant system events.
 * Written directly to database for durability.
 */
export interface AuditLogEntry {
  id?: bigint;
  actorUserId?: string;
  actorOrgId?: string;
  actorIp?: string;
  actorUserAgent?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  changeSummary?: string;
  requestId?: string;
  sessionId?: string;
  createdAt?: Date;
}

/**
 * Audit Logger Service
 * Centralized audit logging with async fire-and-forget writes.
 * All audit logs are immutable and partitioned by month.
 */
@Injectable()
export class AuditLogger {
  private readonly logger = new Logger(AuditLogger.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Log an event asynchronously. Never throws — failures are logged to console.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.auditRepo.save({
        ...entry,
        createdAt: new Date(),
      });
    } catch (err: any) {
      // Audit logging must never break the main flow
      this.logger.error(`Audit log failed: ${err.message}`, err.stack);
      this.logger.warn(`Failed audit entry: ${JSON.stringify(entry)}`);
    }
  }

  /**
   * Log a create event
   */
  async logCreate(params: {
    actorUserId?: string;
    actorOrgId?: string;
    entityType: string;
    entityId: string;
    newState: Record<string, any>;
    summary?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      actorUserId: params.actorUserId,
      actorOrgId: params.actorOrgId,
      action: 'created',
      entityType: params.entityType,
      entityId: params.entityId,
      newState: params.newState,
      changeSummary: params.summary || `${params.entityType} created`,
      requestId: params.requestId,
      actorIp: params.ip,
      actorUserAgent: params.userAgent,
    });
  }

  /**
   * Log an update event with diff
   */
  async logUpdate(params: {
    actorUserId?: string;
    actorOrgId?: string;
    entityType: string;
    entityId: string;
    previousState: Record<string, any>;
    newState: Record<string, any>;
    summary?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const diff = this.computeDiff(params.previousState, params.newState);
    await this.log({
      actorUserId: params.actorUserId,
      actorOrgId: params.actorOrgId,
      action: 'updated',
      entityType: params.entityType,
      entityId: params.entityId,
      previousState: params.previousState,
      newState: params.newState,
      changeSummary: params.summary || `Changed: ${Object.keys(diff).join(', ')}`,
      requestId: params.requestId,
      actorIp: params.ip,
      actorUserAgent: params.userAgent,
    });
  }

  /**
   * Log a delete event
   */
  async logDelete(params: {
    actorUserId?: string;
    actorOrgId?: string;
    entityType: string;
    entityId: string;
    previousState: Record<string, any>;
    summary?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      actorUserId: params.actorUserId,
      actorOrgId: params.actorOrgId,
      action: 'deleted',
      entityType: params.entityType,
      entityId: params.entityId,
      previousState: params.previousState,
      changeSummary: params.summary || `${params.entityType} deleted`,
      requestId: params.requestId,
      actorIp: params.ip,
      actorUserAgent: params.userAgent,
    });
  }

  /**
   * Log a payment event
   */
  async logPayment(params: {
    actorUserId?: string;
    actorOrgId?: string;
    paymentId: string;
    dealId: string;
    action: 'paid' | 'released' | 'refunded' | 'failed';
    amount?: number;
    currency?: string;
    requestId?: string;
    ip?: string;
  }): Promise<void> {
    await this.log({
      actorUserId: params.actorUserId,
      actorOrgId: params.actorOrgId,
      action: params.action,
      entityType: 'payment',
      entityId: params.paymentId,
      changeSummary: `Payment ${params.action}: ${params.amount} ${params.currency} for deal ${params.dealId}`,
      requestId: params.requestId,
      actorIp: params.ip,
    });
  }

  /**
   * Log an authentication event
   */
  async logAuth(params: {
    actorUserId?: string;
    actorOrgId?: string;
    action: 'login' | 'logout' | 'login_failed' | 'mfa_verified' | 'password_changed';
    requestId?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      actorUserId: params.actorUserId,
      actorOrgId: params.actorOrgId,
      action: params.action,
      entityType: 'user',
      entityId: params.actorUserId || 'anonymous',
      changeSummary: `Auth event: ${params.action}`,
      requestId: params.requestId,
      actorIp: params.ip,
      actorUserAgent: params.userAgent,
    });
  }

  private computeDiff(prev: Record<string, any>, next: Record<string, any>): Record<string, { from: any; to: any }> {
    const diff: Record<string, { from: any; to: any }> = {};
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    for (const key of keys) {
      if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
        diff[key] = { from: prev[key], to: next[key] };
      }
    }
    return diff;
  }
}
