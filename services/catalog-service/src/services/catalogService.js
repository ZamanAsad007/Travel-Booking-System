import { flightRepository } from '../repositories/flightRepository.js';
import { hotelRepository } from '../repositories/hotelRepository.js';
import { reservationRepository } from '../repositories/reservationRepository.js';

export const catalogService = {
  async searchFlights(params) {
    return flightRepository.search(params);
  },

  async getFlightById(id) {
    const flight = await flightRepository.findById(id);
    if (!flight) {
      const err = new Error('Flight not found');
      err.statusCode = 404;
      err.code = 'FLIGHT_NOT_FOUND';
      throw err;
    }
    return flight;
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
    return hotel;
  },

  async checkAvailability({ itemType, itemId, quantity = 1 }) {
    if (itemType === 'flight') {
      const flight = await flightRepository.findById(itemId);
      if (!flight) {
        return { available: false, reason: 'Flight not found', item: null };
      }
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
      const isAvailable = room.rooms_available >= quantity;
      return {
        available: isAvailable,
        availableCount: room.rooms_available,
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

  async reserveItem({ itemType, itemId, bookingId, quantity = 1, dateFrom, dateTo }) {
    const availability = await this.checkAvailability({ itemType, itemId, quantity });
    if (!availability.available) {
      const err = new Error(`Item ${itemId} has insufficient availability`);
      err.statusCode = 409;
      err.code = 'INSUFFICIENT_AVAILABILITY';
      throw err;
    }

    const reservation = await reservationRepository.createReservation({
      itemType,
      itemId,
      bookingId,
      quantity,
      dateFrom,
      dateTo,
      status: 'CONFIRMED',
    });

    return reservation;
  },

  async releaseReservation(bookingId) {
    return reservationRepository.releaseReservation(bookingId);
  },
};
