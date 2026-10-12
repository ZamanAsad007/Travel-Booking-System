import { jest } from '@jest/globals';
import { priceAlertService } from '../../services/engagement-service/src/services/priceAlertService.js';
import { priceAlertRepository } from '../../services/engagement-service/src/repositories/priceAlertRepository.js';
import { eventBus } from '../../shared/events/eventBus.js';
import { EVENTS } from '../../shared/constants/events.js';

describe('Price Alerts Event Triggering Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should trigger active price alerts when price drops below target', async () => {
    const activeAlert = {
      id: 'alert-1',
      user_id: 'user-1',
      user_email: 'user@travel.com',
      item_type: 'flight',
      item_id: 'flight-100',
      item_name: 'SkyHigh Flight SH-100',
      target_price: 200.0,
      status: 'ACTIVE',
    };

    jest
      .spyOn(priceAlertRepository, 'findActiveAlertsForPriceDrop')
      .mockResolvedValue([activeAlert]);

    const markSpy = jest
      .spyOn(priceAlertRepository, 'markTriggered')
      .mockResolvedValue({ ...activeAlert, status: 'TRIGGERED' });

    const publishSpy = jest
      .spyOn(eventBus, 'publish')
      .mockResolvedValue({ eventId: 'evt-alert-1' });

    const triggered = await priceAlertService.handlePriceChanged({
      itemType: 'flight',
      itemId: 'flight-100',
      itemName: 'SkyHigh Flight SH-100',
      oldPrice: 220.0,
      newPrice: 195.0,
    });

    expect(markSpy).toHaveBeenCalledWith('alert-1');
    expect(publishSpy).toHaveBeenCalledWith(
      EVENTS.PRICE_ALERT_TRIGGERED,
      expect.objectContaining({
        alertId: 'alert-1',
        userId: 'user-1',
        currentPrice: 195.0,
        targetPrice: 200.0,
      })
    );
    expect(triggered.length).toBe(1);
  });
});
