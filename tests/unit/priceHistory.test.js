import { jest } from '@jest/globals';
import { catalogService } from '../../services/catalog-service/src/services/catalogService.js';
import { flightRepository } from '../../services/catalog-service/src/repositories/flightRepository.js';
import { priceHistoryRepository } from '../../services/catalog-service/src/repositories/priceHistoryRepository.js';
import { eventBus } from '../../shared/events/eventBus.js';
import { EVENTS } from '../../shared/constants/events.js';

describe('Price History & Price Changed Event Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should record price history and publish price.changed event when flight price changes', async () => {
    const flightId = 'f-1111-2222';
    const oldPrice = 250.0;
    const newPrice = 199.99;

    jest.spyOn(flightRepository, 'findById').mockResolvedValue({
      id: flightId,
      airline: 'SkyHigh',
      flight_number: 'SH-101',
      price: oldPrice,
    });

    jest.spyOn(flightRepository, 'update').mockResolvedValue({
      id: flightId,
      airline: 'SkyHigh',
      flight_number: 'SH-101',
      price: newPrice,
    });

    const recordSpy = jest
      .spyOn(priceHistoryRepository, 'recordChange')
      .mockResolvedValue({ id: 'ph-1' });

    const publishSpy = jest
      .spyOn(eventBus, 'publish')
      .mockResolvedValue({ eventId: 'evt-price-1' });

    await catalogService.updateFlight(flightId, { price: newPrice });

    expect(recordSpy).toHaveBeenCalledWith({
      itemType: 'flight',
      itemId: flightId,
      oldPrice,
      newPrice,
    });

    expect(publishSpy).toHaveBeenCalledWith(
      EVENTS.PRICE_CHANGED,
      expect.objectContaining({
        itemType: 'flight',
        itemId: flightId,
        oldPrice,
        newPrice,
      })
    );
  });
});
