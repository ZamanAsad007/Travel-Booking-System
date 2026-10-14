import { redis } from '../config/redis.js';

const CACHE_PREFIX = 'cache:search:';
const DEFAULT_TTL_SECONDS = 120; // 2 minutes TTL for search results

export const searchCache = {
  /**
   * Retrieve cached search data
   */
  async get(key) {
    try {
      if (!redis || redis.status !== 'ready') return null;
      const fullKey = `${CACHE_PREFIX}${key}`;
      const data = await redis.get(fullKey);
      if (!data) return null;
      return JSON.parse(data);
    } catch (err) {
      console.warn(`[catalog-service:cache] Read error for key ${key}:`, err.message);
      return null;
    }
  },

  /**
   * Save search data in cache with TTL
   */
  async set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    try {
      if (!redis || redis.status !== 'ready') return;
      const fullKey = `${CACHE_PREFIX}${key}`;
      await redis.setex(fullKey, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.warn(`[catalog-service:cache] Write error for key ${key}:`, err.message);
    }
  },

  /**
   * Invalidate cached keys matching a specific pattern
   */
  async invalidatePattern(pattern = '*') {
    try {
      if (!redis || redis.status !== 'ready') return;
      const fullPattern = `${CACHE_PREFIX}${pattern}`;
      const keys = await redis.keys(fullPattern);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `[catalog-service:cache] Invalidated ${keys.length} keys matching ${fullPattern}`
        );
      }
    } catch (err) {
      console.warn(
        `[catalog-service:cache] Invalidation error for pattern ${pattern}:`,
        err.message
      );
    }
  },

  /**
   * Invalidate flight search and package bundles caches
   */
  async invalidateFlights() {
    await this.invalidatePattern('flights:*');
    await this.invalidatePattern('bundles:*');
    await this.invalidatePattern('suggest:*');
  },

  /**
   * Invalidate hotel search and package bundles caches
   */
  async invalidateHotels() {
    await this.invalidatePattern('hotels:*');
    await this.invalidatePattern('bundles:*');
    await this.invalidatePattern('suggest:*');
  },

  /**
   * Invalidate all search & suggest caches
   */
  async invalidateAll() {
    await this.invalidatePattern('*');
  },
};
