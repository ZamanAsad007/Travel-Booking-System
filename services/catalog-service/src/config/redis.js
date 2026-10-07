import Redis from 'ioredis';
import { config } from './env.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 1000, 5000);
    console.log(`[catalog-service] Retrying Redis connection in ${delay}ms...`);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('[catalog-service] Connected to Redis.');
});

redis.on('error', (err) => {
  console.error('[catalog-service] Redis error:', err.message);
});
