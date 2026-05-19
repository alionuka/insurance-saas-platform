import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Minimal in-memory cache with TTL — drop-in for hot read paths where
 * Redis would be overkill.
 *
 * Trade-offs:
 *   + zero infrastructure: no Redis, no extra container, no env vars
 *   + sub-microsecond reads (just a Map.get)
 *   - cache is per-process — multiple Railway replicas don't share state
 *   - lost on every restart / deploy
 *
 * Acceptable for catalog-style data where eventual freshness is fine and
 * Postgres can absorb the cold-start re-reads. Replace with Redis if you
 * scale to multiple backend instances or need cross-process consistency.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /** Get-or-compute. The factory only runs on miss / expiry. */
  async wrap<T>(
    key: string,
    ttlMs: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }
    const value = await factory();
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  /** Invalidate a single key (e.g., after a mutation). */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate everything matching a prefix. */
  invalidatePrefix(prefix: string): void {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
      }
    }
  }
}
