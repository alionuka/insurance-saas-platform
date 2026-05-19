import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma client with explicit connection pool tuning.
 *
 * By default, Prisma's connection pool is `num_physical_cpus * 2 + 1`. On a
 * single-vCPU Railway container that's 3 connections, which becomes a
 * bottleneck under concurrent load. We override via the `DATABASE_URL` query
 * string if provided, otherwise we append sensible defaults that mirror
 * common PgBouncer/RDS Proxy patterns:
 *
 *   - `connection_limit=10` — max parallel connections from this client
 *   - `pool_timeout=20`      — seconds to wait for an available connection
 *   - `connect_timeout=10`   — seconds to wait for initial TCP connect
 *
 * For huge production loads, replace this with a real connection pooler
 * (PgBouncer in transaction mode, RDS Proxy, Supabase pooler) and point
 * DATABASE_URL at it.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const baseUrl = process.env.DATABASE_URL;
    const url = baseUrl ? appendPoolParams(baseUrl) : undefined;

    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected with pooled connections');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/**
 * Append connection-pool parameters to a postgres URL if not already present.
 * Idempotent — running it twice doesn't double the params.
 */
function appendPoolParams(url: string): string {
  // Don't touch URLs that already configure these
  if (url.includes('connection_limit=') || url.includes('pool_timeout=')) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connection_limit=10&pool_timeout=20&connect_timeout=10`;
}
