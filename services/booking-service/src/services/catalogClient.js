import axios from 'axios';
import { config } from '../config/env.js';

export const catalogClient = {
  async checkAvailability(itemType, itemId, quantity = 1) {
    try {
      const response = await axios.post(`${config.catalogServiceUrl}/api/catalog/check-availability`, {
        itemType,
        itemId,
        quantity,
      }, { timeout: 5000 });

      if (response.data && response.data.success) {
        return response.data.data;
      }
      return { available: false, reason: 'Invalid response from catalog service' };
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        const err = new Error(error.response.data.error.message);
        err.statusCode = error.response.status;
        err.code = error.response.data.error.code;
        throw err;
      }
      const err = new Error(`Failed to communicate with catalog service: ${error.message}`);
      err.statusCode = 502;
      err.code = 'CATALOG_SERVICE_UNAVAILABLE';
      throw err;
    }
  },

  async createHold({ itemType, itemId, bookingId, quantity = 1, ttlSeconds = 600 }) {
    try {
      const response = await axios.post(`${config.catalogServiceUrl}/api/catalog/holds`, {
        itemType,
        itemId,
        bookingId,
        quantity,
        ttlSeconds,
      }, { timeout: 5000 });

      return response.data.data.hold;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        const err = new Error(error.response.data.error.message);
        err.statusCode = error.response.status;
        err.code = error.response.data.error.code;
        throw err;
      }
      const err = new Error(`Failed to create inventory hold in catalog service: ${error.message}`);
      err.statusCode = 502;
      err.code = 'CATALOG_SERVICE_UNAVAILABLE';
      throw err;
    }
  },

  async releaseHold(bookingId) {
    try {
      const response = await axios.delete(
        `${config.catalogServiceUrl}/api/catalog/holds/${bookingId}`,
        { timeout: 5000 }
      );
      return response.data.data;
    } catch (error) {
      console.error(`[booking-service] Failed to release hold for booking ${bookingId}:`, error.message);
      return null;
    }
  },

  async reserveItem({ itemType, itemId, bookingId, quantity = 1, dateFrom, dateTo }) {
    try {
      const response = await axios.post(`${config.catalogServiceUrl}/api/catalog/reserve`, {
        itemType,
        itemId,
        bookingId,
        quantity,
        dateFrom,
        dateTo,
      }, { timeout: 5000 });

      return response.data.data.reservation;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        const err = new Error(error.response.data.error.message);
        err.statusCode = error.response.status;
        err.code = error.response.data.error.code;
        throw err;
      }
      const err = new Error(`Failed to reserve items in catalog service: ${error.message}`);
      err.statusCode = 502;
      err.code = 'CATALOG_SERVICE_UNAVAILABLE';
      throw err;
    }
  },

  async releaseReservation(bookingId) {
    try {
      const response = await axios.post(
        `${config.catalogServiceUrl}/api/catalog/reservations/${bookingId}/release`,
        {},
        { timeout: 5000 }
      );
      return response.data.data;
    } catch (error) {
      console.error(`[booking-service] Failed to release catalog reservation for booking ${bookingId}:`, error.message);
      return null;
    }
  },
};
