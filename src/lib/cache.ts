/**
 * High-Performance In-Memory Cache Engine for ReadVerse
 * 
 * Provides sub-millisecond retrieval (<5ms) for database queries that are read frequently
 * (e.g. Homepage stories, featured hero stories, categories, daily schedules).
 * Supports automatic TTL expiration and tag-based invalidation.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  /**
   * Get a cached value or compute and store it if missing/expired.
   */
  async remember<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
    tags: string[] = []
  ): Promise<T> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.expiresAt > now) {
      return existing.value as T;
    }

    // Miss or expired -> run fetcher
    const freshData = await fetcher();

    this.store.set(key, {
      value: freshData,
      expiresAt: now + ttlSeconds * 1000,
      tags,
    });

    return freshData;
  }

  /**
   * Directly get a cached value if present and valid.
   */
  get<T>(key: string): T | null {
    const existing = this.store.get(key);
    if (!existing) return null;
    if (existing.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return existing.value as T;
  }

  /**
   * Set a cache entry manually.
   */
  set<T>(key: string, value: T, ttlSeconds: number, tags: string[] = []): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  /**
   * Invalidate all cache entries associated with a specific tag (e.g. "stories", "hero").
   */
  invalidateTag(tag: string): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Delete a specific cache key.
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries to keep memory footprint minimal.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}

// Preserve cache singleton across Next.js fast refresh in development
const globalForCache = globalThis as unknown as {
  memoryCache: MemoryCache | undefined;
};

export const memoryCache = globalForCache.memoryCache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.memoryCache = memoryCache;
}

// Periodic cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    memoryCache.cleanup();
  }, 5 * 60 * 1000).unref?.();
}
