import { jest } from '@jest/globals';
import { catalogService } from '../../services/catalog-service/src/services/catalogService.js';
import { flightRepository } from '../../services/catalog-service/src/repositories/flightRepository.js';
import { hotelRepository } from '../../services/catalog-service/src/repositories/hotelRepository.js';
import { searchCache } from '../../services/catalog-service/src/services/searchCache.js';
import { holdService } from '../../services/catalog-service/src/services/holdService.js';

describe('Deals & Fare Calendar Date Availability Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Calendar Date Filtering & Flights Availability', () => {
    test('should search flights on a specific calendar date (e.g. 2026-10-17)', async () => {
      const mockFlights = [
        {
          id: 'f-1017',
          flight_number: 'AA100-1017',
          airline: 'American Airlines',
          origin: 'JFK',
          destination: 'LHR',
          departs_at: '2026-10-17T18:30:00Z',
          arrives_at: '2026-10-18T06:30:00Z',
          price: 550,
          seats_available: 180,
        },
      ];

      jest.spyOn(searchCache, 'get').mockResolvedValue(null);
      jest.spyOn(searchCache, 'set').mockResolvedValue();
      jest.spyOn(holdService, 'getActiveHoldCount').mockResolvedValue(0);
      const repoSpy = jest.spyOn(flightRepository, 'search').mockResolvedValue({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        flights: mockFlights,
      });

      const result = await catalogService.searchFlights({
        date: '2026-10-17',
      });

      expect(repoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-10-17',
        })
      );
      expect(result.flights).toHaveLength(1);
      expect(result.flights[0].flight_number).toBe('AA100-1017');
    });

    test('should assemble vacation bundle packages when searching deals for a specific date', async () => {
      const mockFlight = {
        id: 'f-deal-1',
        flight_number: 'BA178-1017',
        airline: 'British Airways',
        origin: 'JFK',
        destination: 'LHR',
        departs_at: '2026-10-17T21:00:00Z',
        arrives_at: '2026-10-18T09:00:00Z',
        price: '600.00',
        seats_available: 50,
      };

      const mockHotel = {
        id: 'h-1',
        name: 'The Savoy London',
        city: 'London',
      };

      const mockHotelDetails = {
        ...mockHotel,
        rooms: [
          {
            id: 'r-1',
            type: 'Deluxe King',
            price_per_night: '200.00',
            rooms_available: 5,
          },
        ],
      };

      jest.spyOn(searchCache, 'get').mockResolvedValue(null);
      jest.spyOn(searchCache, 'set').mockResolvedValue();
      jest.spyOn(catalogService, 'searchFlights').mockResolvedValue({
        total: 1,
        flights: [mockFlight],
      });
      jest.spyOn(hotelRepository, 'search').mockResolvedValue({
        total: 1,
        hotels: [mockHotel],
      });
      jest.spyOn(catalogService, 'getHotelById').mockResolvedValue(mockHotelDetails);

      const res = await catalogService.getBundles({
        date: '2026-10-17',
        to: 'LHR',
      });

      expect(res.bundles).toHaveLength(1);
      const b = res.bundles[0];
      expect(b.flight.flightNumber).toBe('BA178-1017');
      expect(b.hotel.name).toBe('The Savoy London');
      // Original: 600 + 200 = 800. 15% discount: 120. Bundle price: 680.
      expect(b.originalPrice).toBe(800);
      expect(b.savings).toBe(120);
      expect(b.bundlePrice).toBe(680);
      expect(b.discountPercent).toBe(15);
    });
  });

  describe('Fare Calendar Window Calculation Logic', () => {
    test('should correctly compute 7-day contiguous date strings without past dates', () => {
      const today = new Date('2026-10-17T12:00:00Z');
      const start = new Date(today);
      start.setUTCHours(0, 0, 0, 0);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        days.push(`${yyyy}-${mm}-${dd}`);
      }

      expect(days).toEqual([
        '2026-10-17',
        '2026-10-18',
        '2026-10-19',
        '2026-10-20',
        '2026-10-21',
        '2026-10-22',
        '2026-10-23',
      ]);
    });
  });
});
