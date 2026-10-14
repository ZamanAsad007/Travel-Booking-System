import { jest } from '@jest/globals';
import { catalogService } from '../../services/catalog-service/src/services/catalogService.js';
import { flightRepository } from '../../services/catalog-service/src/repositories/flightRepository.js';
import { hotelRepository } from '../../services/catalog-service/src/repositories/hotelRepository.js';
import { searchCache } from '../../services/catalog-service/src/services/searchCache.js';
import { holdService } from '../../services/catalog-service/src/services/holdService.js';
import { bookingService } from '../../services/booking-service/src/services/bookingService.js';
import { catalogClient } from '../../services/booking-service/src/services/catalogClient.js';
import { bookingRepository } from '../../services/booking-service/src/repositories/bookingRepository.js';
import { eventBus } from '../../shared/events/eventBus.js';

describe('Phase 21: Search Upgrade & Trip Bundles Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Redis Search Caching', () => {
    test('searchFlights should check cache before querying repository', async () => {
      const mockResult = {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        flights: [
          {
            id: 'f-1',
            flight_number: 'AA100',
            airline: 'American Airlines',
            price: 500,
            seats_available: 20,
          },
        ],
      };

      const getSpy = jest.spyOn(searchCache, 'get').mockResolvedValue(mockResult);
      const searchSpy = jest.spyOn(flightRepository, 'search');

      const result = await catalogService.searchFlights({ from: 'JFK', to: 'LHR' });

      expect(getSpy).toHaveBeenCalled();
      expect(searchSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    test('searchHotels should cache query results in Redis', async () => {
      const mockResult = {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hotels: [
          {
            id: 'h-1',
            name: 'The Savoy',
            city: 'London',
            starting_price: 350,
          },
        ],
      };

      jest.spyOn(searchCache, 'get').mockResolvedValue(null);
      const setSpy = jest.spyOn(searchCache, 'set').mockResolvedValue();
      jest.spyOn(hotelRepository, 'search').mockResolvedValue(mockResult);

      const result = await catalogService.searchHotels({ city: 'London' });

      expect(setSpy).toHaveBeenCalledWith(expect.stringContaining('hotels:'), mockResult, 60);
      expect(result).toEqual(mockResult);
    });

    test('inventory changes should invalidate search caches', async () => {
      const invalidateSpy = jest.spyOn(searchCache, 'invalidateAll').mockResolvedValue();
      jest.spyOn(holdService, 'releaseAllHoldsForBooking').mockResolvedValue(true);

      await catalogService.releaseHolds('b-test-123');
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('Autocomplete / Suggest Endpoint', () => {
    test('suggest should return matching airport, city, and airline suggestions', async () => {
      jest.spyOn(searchCache, 'get').mockResolvedValue(null);
      jest.spyOn(searchCache, 'set').mockResolvedValue();

      jest.spyOn(flightRepository, 'suggestAirportsAndAirlines').mockResolvedValue([
        { code: 'LHR', type: 'airport' },
        { code: 'British Airways', type: 'airline' },
      ]);

      jest.spyOn(hotelRepository, 'suggestCitiesAndHotels').mockResolvedValue([
        { name: 'London', type: 'city', hotel_id: null },
        { name: 'The Savoy London', type: 'hotel', hotel_id: 'hotel-savoy-1' },
      ]);

      const res = await catalogService.suggest('lon');

      expect(res.suggestions).toBeDefined();
      expect(res.suggestions.length).toBeGreaterThanOrEqual(3);

      const airport = res.suggestions.find((s) => s.type === 'airport');
      expect(airport).toBeDefined();
      expect(airport.code).toBe('LHR');
      expect(airport.text).toContain('London');

      const airline = res.suggestions.find((s) => s.type === 'airline');
      expect(airline).toBeDefined();
      expect(airline.name).toBe('British Airways');

      const hotel = res.suggestions.find((s) => s.type === 'hotel');
      expect(hotel).toBeDefined();
      expect(hotel.name).toBe('The Savoy London');
    });
  });

  describe('Trip Bundles (Flight + Hotel Packages)', () => {
    test('getBundles should return packages with 15% bundle discount applied', async () => {
      jest.spyOn(searchCache, 'get').mockResolvedValue(null);
      jest.spyOn(searchCache, 'set').mockResolvedValue();

      jest.spyOn(catalogService, 'searchFlights').mockResolvedValue({
        flights: [
          {
            id: 'flight-1',
            flight_number: 'AA100',
            airline: 'American Airlines',
            origin: 'JFK',
            destination: 'LHR',
            departs_at: '2026-11-01T18:00:00Z',
            arrives_at: '2026-11-02T06:00:00Z',
            price: 500.0,
            seats_available: 10,
          },
        ],
      });

      jest.spyOn(hotelRepository, 'search').mockResolvedValue({
        hotels: [
          {
            id: 'hotel-1',
            name: 'The Savoy London',
            city: 'London',
          },
        ],
      });

      jest.spyOn(catalogService, 'getHotelById').mockResolvedValue({
        id: 'hotel-1',
        name: 'The Savoy London',
        city: 'London',
        rooms: [
          {
            id: 'room-1',
            type: 'Deluxe Suite',
            price_per_night: 300.0,
            rooms_available: 5,
          },
        ],
      });

      const res = await catalogService.getBundles({ from: 'JFK', to: 'LHR' });

      expect(res.total).toBe(1);
      expect(res.discountPercent).toBe(15);
      const bundle = res.bundles[0];

      // Flight = $500, Room = $300 -> Total = $800. 15% discount = $120. Bundle Price = $680
      expect(bundle.originalPrice).toBe(800.0);
      expect(bundle.savings).toBe(120.0);
      expect(bundle.bundlePrice).toBe(680.0);

      // Verify bundle contains both items for multi-item cart
      expect(bundle.items.length).toBe(2);
      expect(bundle.items[0]).toEqual(
        expect.objectContaining({ itemType: 'flight', itemId: 'flight-1' })
      );
      expect(bundle.items[1]).toEqual(
        expect.objectContaining({ itemType: 'hotel', itemId: 'room-1' })
      );
    });
  });

  describe('Multi-Item Booking Support', () => {
    test('bookingService.createBooking should create multi-item booking for bundle', async () => {
      const items = [
        { itemType: 'flight', itemId: '11111111-1111-1111-1111-111111111111', quantity: 1 },
        { itemType: 'hotel', itemId: '22222222-2222-2222-2222-222222222222', quantity: 1 },
      ];

      jest.spyOn(catalogClient, 'checkAvailability').mockImplementation(async (type, id) => {
        if (type === 'flight') return { available: true, unitPrice: 500 };
        if (type === 'hotel') return { available: true, unitPrice: 300 };
        return { available: false };
      });

      jest.spyOn(bookingRepository, 'createBooking').mockResolvedValue({
        id: '33333333-3333-3333-3333-333333333333',
        user_id: 'user-1',
        total_amount: 800.0,
        status: 'PENDING',
        items,
      });

      jest.spyOn(catalogClient, 'createHold').mockResolvedValue({ id: 'hold-1' });
      jest.spyOn(eventBus, 'publish').mockResolvedValue();

      const booking = await bookingService.createBooking({
        userId: 'user-1',
        items,
        travelers: [
          {
            full_name: 'John Doe',
            passport_no: 'A1234567',
            date_of_birth: '1990-01-01',
          },
        ],
      });

      expect(booking).toBeDefined();
      expect(catalogClient.checkAvailability).toHaveBeenCalledTimes(2);
      expect(catalogClient.createHold).toHaveBeenCalledTimes(2);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'booking.created',
        expect.objectContaining({
          bookingId: '33333333-3333-3333-3333-333333333333',
          amount: 800.0,
        })
      );
    });
  });
});
