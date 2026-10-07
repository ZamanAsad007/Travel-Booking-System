import { flightRepository } from '../repositories/flightRepository.js';
import { hotelRepository } from '../repositories/hotelRepository.js';
import { reservationRepository } from '../repositories/reservationRepository.js';
import { holdService } from './holdService.js';

export const catalogService = {
  async searchFlights(params) {
    const result = await flightRepository.search(params);
    // Adjust seats_available with active Redis holds
    const enrichedFlights = await Promise.all(
      result.flights.map(async (flight) => {
        const heldCount = await holdService.getActiveHoldCount('flight', flight.id);
        const actualAvailable = Math.max(0, flight.seats_available - heldCount);
        return {
          ...flight,
          seats_available: actualAvailable,
        };
      })
    );
    return {
      ...result,
      flights: enrichedFlights,
    };
  },

  async getFlightById(id) {
    const flight = await flightRepository.findById(id);
    if (!flight) {
      const err = new Error('Flight not found');
      err.statusCode = 404;
      err.code = 'FLIGHT_NOT_FOUND';
      throw err;
    }

    const heldCount = await holdService.getActiveHoldCount('flight', id);
    const actualAvailable = Math.max(0, flight.seats_available - heldCount);

    return {
      ...flight,
      seats_available: actualAvailable,
    };
  },

  async searchHotels(params) {
    return hotelRepository.search(params);
  },

  async getHotelById(id) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) {
      const err = new Error('Hotel not found');
      err.statusCode = 404;
      err.code = 'HOTEL_NOT_FOUND';
      throw err;
    }

    const enrichedRooms = await Promise.all(
      hotel.rooms.map(async (room) => {
        const heldCount = await holdService.getActiveHoldCount('hotel', room.id);
        const actualAvailable = Math.max(0, room.rooms_available - heldCount);
        return {
          ...room,
          rooms_available: actualAvailable,
        };
      })
    );

    return {
      ...hotel,
      rooms: enrichedRooms,
    };
  },

  async checkAvailability({ itemType, itemId, quantity = 1 }) {
    if (itemType === 'flight') {
      const flight = await this.getFlightById(itemId);
      const isAvailable = flight.seats_available >= quantity;
      return {
        available: isAvailable,
        availableCount: flight.seats_available,
        unitPrice: parseFloat(flight.price),
        item: flight,
      };
    } else if (itemType === 'hotel') {
      const room = await hotelRepository.findRoomById(itemId);
      if (!room) {
        return { available: false, reason: 'Room not found', item: null };
      }
      const heldCount = await holdService.getActiveHoldCount('hotel', itemId);
      const actualAvailable = Math.max(0, room.rooms_available - heldCount);
      const isAvailable = actualAvailable >= quantity;
      return {
        available: isAvailable,
        availableCount: actualAvailable,
        unitPrice: parseFloat(room.price_per_night),
        item: room,
      };
    } else {
      const err = new Error(`Invalid itemType: ${itemType}. Must be 'flight' or 'hotel'`);
      err.statusCode = 400;
      err.code = 'INVALID_ITEM_TYPE';
      throw err;
    }
  },

  async createHold({ itemType, itemId, bookingId, quantity = 1, ttlSeconds = 600 }) {
    const availability = await this.checkAvailability({ itemType, itemId, quantity });
    if (!availability.available) {
      const err = new Error(`Item ${itemId} (${itemType}) is unavailable or sold out`);
      err.statusCode = 409;
      err.code = 'INSUFFICIENT_AVAILABILITY';
      throw err;
    }

    return holdService.createHold({ itemType, itemId, bookingId, quantity, ttlSeconds });
  },

  async releaseHolds(bookingId) {
    return holdService.releaseAllHoldsForBooking(bookingId);
  },

  async confirmHoldToReservation(params) {
    return holdService.confirmHoldToReservation(params);
  },

  async reserveItem({ itemType, itemId, bookingId, quantity = 1, dateFrom, dateTo }) {
    return reservationRepository.createReservation({
      itemType,
      itemId,
      bookingId,
      quantity,
      dateFrom,
      dateTo,
      status: 'CONFIRMED',
    });
  },

  async releaseReservation(bookingId) {
    return reservationRepository.releaseReservation(bookingId);
  },
};
