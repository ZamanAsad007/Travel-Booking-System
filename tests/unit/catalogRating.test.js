import { jest } from '@jest/globals';
import { catalogService } from '../../services/catalog-service/src/services/catalogService.js';
import { flightRepository } from '../../services/catalog-service/src/repositories/flightRepository.js';
import { hotelRepository } from '../../services/catalog-service/src/repositories/hotelRepository.js';

describe('Catalog Rating Event Consumer Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should update flight average rating on flight review event', async () => {
    const flightSpy = jest.spyOn(flightRepository, 'updateRating').mockResolvedValue({
      id: 'flight-uuid-1',
      avg_rating: 4.8,
      review_count: 5,
    });

    const res = await catalogService.updateItemRating({
      itemType: 'flight',
      itemId: 'flight-uuid-1',
      rating: 5,
    });

    expect(flightSpy).toHaveBeenCalledWith('flight-uuid-1', 5);
    expect(res.avg_rating).toBe(4.8);
    expect(res.review_count).toBe(5);
  });

  test('should update hotel average rating on hotel review event', async () => {
    const hotelSpy = jest.spyOn(hotelRepository, 'updateRating').mockResolvedValue({
      id: 'hotel-uuid-1',
      avg_rating: 4.5,
      rating: 4.5,
      review_count: 10,
    });

    const res = await catalogService.updateItemRating({
      itemType: 'hotel',
      itemId: 'hotel-uuid-1',
      rating: 4,
    });

    expect(hotelSpy).toHaveBeenCalledWith('hotel-uuid-1', 4);
    expect(res.avg_rating).toBe(4.5);
    expect(res.review_count).toBe(10);
  });
});
