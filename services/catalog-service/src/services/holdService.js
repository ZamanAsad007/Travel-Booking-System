import { redis } from '../config/redis.js';
import { reservationRepository } from '../repositories/reservationRepository.js';

export const holdService = {
  getHoldKey(itemType, itemId, bookingId) {
    return `hold:${itemType}:${itemId}:${bookingId}`;
  },

  async getActiveHoldCount(itemType, itemId) {
    const pattern = `hold:${itemType}:${itemId}:*`;
    let cursor = '0';
    let totalHeld = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        const values = await redis.mget(keys);
        for (const val of values) {
          if (val) {
            try {
              const parsed = JSON.parse(val);
              totalHeld += parsed.quantity || 1;
            } catch (e) {
              totalHeld += 1;
            }
          }
        }
      }
    } while (cursor !== '0');

    return totalHeld;
  },

  async createHold({ itemType, itemId, bookingId, quantity = 1, ttlSeconds = 600 }) {
    const key = this.getHoldKey(itemType, itemId, bookingId);

    const holdData = {
      bookingId,
      itemType,
      itemId,
      quantity,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    await redis.set(key, JSON.stringify(holdData), 'EX', ttlSeconds);
    console.log(`[catalog-service] Created Redis inventory hold: ${key} (TTL: ${ttlSeconds}s)`);
    return holdData;
  },

  async releaseHold(itemType, itemId, bookingId) {
    const key = this.getHoldKey(itemType, itemId, bookingId);
    await redis.del(key);
    console.log(`[catalog-service] Released Redis hold: ${key}`);
  },

  async releaseAllHoldsForBooking(bookingId) {
    const pattern = `hold:*:*:${bookingId}`;
    let cursor = '0';
    const keysToDelete = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      console.log(`[catalog-service] Released ${keysToDelete.length} holds for booking ${bookingId}`);
    }

    // Also update any database reservations if present
    await reservationRepository.releaseReservation(bookingId);
  },

  async confirmHoldToReservation({ itemType, itemId, bookingId, quantity = 1, dateFrom, dateTo }) {
    // 1. Create persistent reservation row
    const reservation = await reservationRepository.createReservation({
      itemType,
      itemId,
      bookingId,
      quantity,
      dateFrom,
      dateTo,
      status: 'CONFIRMED',
    });

    // 2. Remove Redis hold key since it is now permanently reserved
    await this.releaseHold(itemType, itemId, bookingId);
    console.log(`[catalog-service] Converted hold to confirmed reservation for booking ${bookingId}`);
    return reservation;
  },
};
