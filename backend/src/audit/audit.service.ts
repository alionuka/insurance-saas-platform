import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, AuditLog, Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: {
    action: string;
    actor?: { id: string; email?: string | null; role: UserRole } | null;
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
          metadata: entry.metadata as Prisma.InputJsonValue,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error: unknown) {
      // An audit failure must NEVER break a business operation.
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to record audit log: ${message}`, stack);
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
    const where: Prisma.AuditLogWhereInput = {};

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
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (filters.from) {
        createdAtFilter.gte = filters.from;
      }
      if (filters.to) {
        createdAtFilter.lte = filters.to;
      }
      where.createdAt = createdAtFilter;
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

  async listForUser(
    userId: string,
    pagination: { limit: number; offset: number },
  ) {
    const where = { actorId: userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
