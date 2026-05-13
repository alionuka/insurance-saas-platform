import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, AuditLog } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: {
    action: string;
    actor?: { id: string; email: string; role: UserRole } | null;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          actorId: entry.actor?.id,
          actorEmail: entry.actor?.email,
          actorRole: entry.actor?.role,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          metadata: entry.metadata as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      // An audit failure must NEVER break a business operation.
      this.logger.error(`Failed to record audit log: ${error.message}`, error.stack);
    }
  }

  async list(filters: {
    action?: string;
    actorId?: string;
    resourceType?: string;
    from?: Date;
    to?: Date;
    limit: number;
    offset: number;
  }): Promise<{ items: AuditLog[]; total: number }> {
    const where: any = {};

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = filters.from;
      }
      if (filters.to) {
        where.createdAt.lte = filters.to;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
