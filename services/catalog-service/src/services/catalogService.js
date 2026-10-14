import { flightRepository } from '../repositories/flightRepository.js';
import { hotelRepository } from '../repositories/hotelRepository.js';
import { reservationRepository } from '../repositories/reservationRepository.js';
import { priceHistoryRepository } from '../repositories/priceHistoryRepository.js';
import { holdService } from './holdService.js';
import { searchCache } from './searchCache.js';
import { eventBus } from '../../../../shared/events/eventBus.js';
import { EVENTS } from '../../../../shared/constants/events.js';

const AIRPORT_DETAILS = {
  JFK: { name: 'New York (JFK)', city: 'New York', country: 'United States' },
  LAX: { name: 'Los Angeles (LAX)', city: 'Los Angeles', country: 'United States' },
  LHR: { name: 'London Heathrow (LHR)', city: 'London', country: 'United Kingdom' },
  CDG: { name: 'Paris Charles de Gaulle (CDG)', city: 'Paris', country: 'France' },
  DXB: { name: 'Dubai (DXB)', city: 'Dubai', country: 'United Arab Emirates' },
  HND: { name: 'Tokyo Haneda (HND)', city: 'Tokyo', country: 'Japan' },
  FRA: { name: 'Frankfurt (FRA)', city: 'Frankfurt', country: 'Germany' },
  SIN: { name: 'Singapore Changi (SIN)', city: 'Singapore', country: 'Singapore' },
};

const AIRPORT_TO_CITY = {
  JFK: 'New York',
  LAX: 'Los Angeles',
  LHR: 'London',
  CDG: 'Paris',
  DXB: 'Dubai',
  HND: 'Tokyo',
  FRA: 'Frankfurt',
  SIN: 'Singapore',
};

export const catalogService = {
  async searchFlights(params) {
    const cacheKey = `flights:${JSON.stringify(params || {})}`;
    const cached = await searchCache.get(cacheKey);
    if (cached) return cached;

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

    const response = {
      ...result,
      flights: enrichedFlights,
    };

    await searchCache.set(cacheKey, response, 60);
    return response;
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
    const cacheKey = `hotels:${JSON.stringify(params || {})}`;
    const cached = await searchCache.get(cacheKey);
    if (cached) return cached;

    const result = await hotelRepository.search(params);
    await searchCache.set(cacheKey, result, 60);
    return result;
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
    const res = await holdService.releaseAllHoldsForBooking(bookingId);
    await searchCache.invalidateAll();
    return res;
  },

  async confirmHoldToReservation(params) {
    const res = await holdService.confirmHoldToReservation(params);
    await searchCache.invalidateAll();
    return res;
  },

  async reserveItem({ itemType, itemId, bookingId, quantity = 1, dateFrom, dateTo }) {
    const res = await reservationRepository.createReservation({
      itemType,
      itemId,
      bookingId,
      quantity,
      dateFrom,
      dateTo,
      status: 'CONFIRMED',
    });
    await searchCache.invalidateAll();
    return res;
  },

  async releaseReservation(bookingId) {
    const res = await reservationRepository.releaseReservation(bookingId);
    await searchCache.invalidateAll();
    return res;
  },

  // Autocomplete / Suggestions
  async suggest(q = '') {
    const cacheKey = `suggest:${(q || '').toLowerCase().trim()}`;
    const cached = await searchCache.get(cacheKey);
    if (cached) return cached;

    const term = (q || '').trim();
    const flightMatches = await flightRepository.suggestAirportsAndAirlines(term);
    const hotelMatches = await hotelRepository.suggestCitiesAndHotels(term);

    const suggestions = [];
    const seen = new Set();

    // 1. Airports & Cities
    for (const match of flightMatches) {
      if (match.type === 'airport') {
        const code = match.code.toUpperCase();
        const details = AIRPORT_DETAILS[code];
        const text = details ? details.name : code;
        const key = `airport:${code}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            type: 'airport',
            code,
            text,
            city: details?.city || code,
            country: details?.country || '',
          });
        }
      } else if (match.type === 'airline') {
        const key = `airline:${match.code}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            type: 'airline',
            name: match.code,
            text: match.code,
          });
        }
      }
    }

    // 2. Hotel Cities & Hotel Names
    for (const match of hotelMatches) {
      if (match.type === 'city') {
        const key = `city:${match.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            type: 'city',
            name: match.name,
            text: `${match.name}`,
          });
        }
      } else if (match.type === 'hotel') {
        const key = `hotel:${match.hotel_id || match.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            type: 'hotel',
            id: match.hotel_id,
            name: match.name,
            text: match.name,
          });
        }
      }
    }

    const result = { suggestions: suggestions.slice(0, 12) };
    await searchCache.set(cacheKey, result, 300);
    return result;
  },

  async getAirlines() {
    return flightRepository.getDistinctAirlines();
  },

  // Trip Bundles (Flight + Hotel Packages with 15% discount)
  async getBundles({ from, to, date, limit = 10 }) {
    const cacheKey = `bundles:${from || ''}:${to || ''}:${date || ''}:${limit}`;
    const cached = await searchCache.get(cacheKey);
    if (cached) return cached;

    // Determine target destination city
    let targetCity = null;
    if (to) {
      const upperTo = to.toUpperCase().trim();
      targetCity = AIRPORT_TO_CITY[upperTo] || to.trim();
    }

    // Search flights
    const flightSearch = await this.searchFlights({
      from: from ? from.trim() : undefined,
      to: to ? to.trim() : undefined,
      date: date || undefined,
      limit: 15,
    });

    const bundles = [];
    const discountPercent = 15;

    for (const flight of flightSearch.flights) {
      if (flight.seats_available <= 0) continue;

      const destinationCity =
        targetCity || AIRPORT_TO_CITY[flight.destination] || flight.destination;
      const hotelRes = await hotelRepository.search({
        city: destinationCity,
        limit: 3,
      });

      for (const hotel of hotelRes.hotels) {
        const hotelDetails = await this.getHotelById(hotel.id);
        const availableRooms = (hotelDetails.rooms || []).filter((r) => r.rooms_available > 0);

        for (const room of availableRooms) {
          const flightPrice = parseFloat(flight.price);
          const roomPrice = parseFloat(room.price_per_night);
          const originalPrice = Math.round((flightPrice + roomPrice) * 100) / 100;
          const savings = Math.round(originalPrice * (discountPercent / 100) * 100) / 100;
          const bundlePrice = Math.round((originalPrice - savings) * 100) / 100;

          bundles.push({
            id: `bundle-${flight.id}-${room.id}`,
            title: `${flight.origin} to ${flight.destination} + ${hotel.name}`,
            origin: flight.origin,
            destination: flight.destination,
            city: hotel.city,
            flight: {
              id: flight.id,
              flightNumber: flight.flight_number,
              airline: flight.airline,
              origin: flight.origin,
              destination: flight.destination,
              departsAt: flight.departs_at,
              arrivesAt: flight.arrives_at,
              durationMinutes: flight.duration_minutes,
              price: flightPrice,
              avgRating: flight.avg_rating,
              seatsAvailable: flight.seats_available,
            },
            hotel: {
              id: hotel.id,
              name: hotel.name,
              city: hotel.city,
              address: hotel.address,
              rating: hotel.rating,
              avgRating: hotel.avg_rating,
              reviewCount: hotel.review_count,
              imageUrl: hotel.image_url,
              freeCancellation: hotel.free_cancellation,
            },
            room: {
              id: room.id,
              type: room.type,
              pricePerNight: roomPrice,
              roomsAvailable: room.rooms_available,
            },
            originalPrice,
            bundlePrice,
            savings,
            discountPercent,
            items: [
              {
                itemType: 'flight',
                itemId: flight.id,
                quantity: 1,
                price: flightPrice,
                title: `${flight.airline} (${flight.origin} -> ${flight.destination})`,
              },
              {
                itemType: 'hotel',
                itemId: room.id,
                quantity: 1,
                price: roomPrice,
                title: `${hotel.name} - ${room.type}`,
              },
            ],
          });

          if (bundles.length >= limit) break;
        }
        if (bundles.length >= limit) break;
      }
      if (bundles.length >= limit) break;
    }

    const response = {
      total: bundles.length,
      discountPercent,
      bundles,
    };

    await searchCache.set(cacheKey, response, 120);
    return response;
  },

  // Admin methods
  async createFlight(data) {
    const flight = await flightRepository.create(data);
    await searchCache.invalidateFlights();
    return flight;
  },

  async updateFlight(id, data) {
    const existing = await flightRepository.findById(id);
    if (!existing) {
      const err = new Error('Flight not found');
      err.statusCode = 404;
      err.code = 'FLIGHT_NOT_FOUND';
      throw err;
    }
    const updated = await flightRepository.update(id, data);
    await searchCache.invalidateFlights();

    if (data.price !== undefined && parseFloat(data.price) !== parseFloat(existing.price)) {
      await priceHistoryRepository.recordChange({
        itemType: 'flight',
        itemId: id,
        oldPrice: parseFloat(existing.price),
        newPrice: parseFloat(data.price),
      });
      try {
        await eventBus.publish(EVENTS.PRICE_CHANGED, {
          itemType: 'flight',
          itemId: id,
          itemName: `${existing.airline} ${existing.flight_number}`,
          oldPrice: parseFloat(existing.price),
          newPrice: parseFloat(data.price),
          changedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[catalog-service] Failed to publish price.changed event:', e.message);
      }
    }
    return updated;
  },

  async deleteFlight(id) {
    const existing = await flightRepository.findById(id);
    if (!existing) {
      const err = new Error('Flight not found');
      err.statusCode = 404;
      err.code = 'FLIGHT_NOT_FOUND';
      throw err;
    }
    const res = await flightRepository.delete(id);
    await searchCache.invalidateFlights();
    return res;
  },

  async createHotel(data) {
    const hotel = await hotelRepository.createHotel(data);
    await searchCache.invalidateHotels();
    return hotel;
  },

  async updateHotel(id, data) {
    const existing = await hotelRepository.findById(id);
    if (!existing) {
      const err = new Error('Hotel not found');
      err.statusCode = 404;
      err.code = 'HOTEL_NOT_FOUND';
      throw err;
    }
    const res = await hotelRepository.updateHotel(id, data);
    await searchCache.invalidateHotels();
    return res;
  },

  async deleteHotel(id) {
    const existing = await hotelRepository.findById(id);
    if (!existing) {
      const err = new Error('Hotel not found');
      err.statusCode = 404;
      err.code = 'HOTEL_NOT_FOUND';
      throw err;
    }
    const res = await hotelRepository.deleteHotel(id);
    await searchCache.invalidateHotels();
    return res;
  },

  async createRoom(data) {
    const hotel = await hotelRepository.findById(data.hotel_id);
    if (!hotel) {
      const err = new Error('Hotel not found');
      err.statusCode = 404;
      err.code = 'HOTEL_NOT_FOUND';
      throw err;
    }
    const room = await hotelRepository.createRoom(data);
    await searchCache.invalidateHotels();
    return room;
  },

  async updateRoom(id, data) {
    const existing = await hotelRepository.findRoomById(id);
    if (!existing) {
      const err = new Error('Room not found');
      err.statusCode = 404;
      err.code = 'ROOM_NOT_FOUND';
      throw err;
    }
    const updated = await hotelRepository.updateRoom(id, data);
    await searchCache.invalidateHotels();

    if (
      data.price_per_night !== undefined &&
      parseFloat(data.price_per_night) !== parseFloat(existing.price_per_night)
    ) {
      await priceHistoryRepository.recordChange({
        itemType: 'hotel',
        itemId: existing.hotel_id,
        oldPrice: parseFloat(existing.price_per_night),
        newPrice: parseFloat(data.price_per_night),
      });
      try {
        await eventBus.publish(EVENTS.PRICE_CHANGED, {
          itemType: 'hotel',
          itemId: existing.hotel_id,
          itemName: `${existing.hotel_name} (${existing.type})`,
          oldPrice: parseFloat(existing.price_per_night),
          newPrice: parseFloat(data.price_per_night),
          changedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[catalog-service] Failed to publish price.changed event:', e.message);
      }
    }
    return updated;
  },

  async deleteRoom(id) {
    const existing = await hotelRepository.findRoomById(id);
    if (!existing) {
      const err = new Error('Room not found');
      err.statusCode = 404;
      err.code = 'ROOM_NOT_FOUND';
      throw err;
    }
    const res = await hotelRepository.deleteRoom(id);
    await searchCache.invalidateHotels();
    return res;
  },

  async updateItemRating({ itemType, itemId, rating }) {
    if (!itemType || !itemId || rating === undefined) return null;
    const normalizedType = itemType.toLowerCase();
    let res = null;
    if (normalizedType === 'flight') {
      res = await flightRepository.updateRating(itemId, rating);
    } else if (normalizedType === 'hotel') {
      res = await hotelRepository.updateRating(itemId, rating);
    }
    await searchCache.invalidateAll();
    return res;
  },

  async getPriceHistory({ itemType, itemId }) {
    if (!itemType || !itemId) {
      const err = new Error('itemType and itemId are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    return priceHistoryRepository.getHistory({ itemType, itemId });
  },
};
