import { priceAlertRepository } from '../repositories/priceAlertRepository.js';
import { eventBus } from '../../../../shared/events/eventBus.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export const priceAlertService = {
  async getUserAlerts(userId) {
    return priceAlertRepository.findByUser(userId);
  },

  async createAlert({ userId, userEmail, itemType, itemId, itemName, targetPrice }) {
    if (!itemType || !itemId || targetPrice === undefined) {
      const err = new Error('itemType, itemId, and targetPrice are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      const err = new Error('targetPrice must be a positive number');
      err.statusCode = 400;
      err.code = 'INVALID_TARGET_PRICE';
      throw err;
    }

    return priceAlertRepository.create({
      userId,
      userEmail,
      itemType,
      itemId,
      itemName,
      targetPrice: price,
    });
  },

  async deleteAlert(userId, alertId) {
    return priceAlertRepository.delete(userId, alertId);
  },

  async handlePriceChanged({ itemType, itemId, itemName, oldPrice, newPrice }) {
    if (!itemType || !itemId || newPrice === undefined) return [];

    console.log(
      `[engagement-service] Checking price alerts for ${itemType} ${itemId}: newPrice=${newPrice}`
    );

    const activeAlerts = await priceAlertRepository.findActiveAlertsForPriceDrop({
      itemType,
      itemId,
      newPrice: parseFloat(newPrice),
    });

    const triggered = [];
    for (const alert of activeAlerts) {
      const updated = await priceAlertRepository.markTriggered(alert.id);
      triggered.push(updated);

      try {
        await eventBus.publish(EVENTS.PRICE_ALERT_TRIGGERED, {
          alertId: alert.id,
          userId: alert.user_id,
          userEmail: alert.user_email,
          itemType: alert.item_type,
          itemId: alert.item_id,
          itemName: alert.item_name || itemName,
          targetPrice: parseFloat(alert.target_price),
          currentPrice: parseFloat(newPrice),
          oldPrice: oldPrice ? parseFloat(oldPrice) : null,
          triggeredAt: new Date().toISOString(),
        });
        console.log(
          `[engagement-service] Triggered and published alert for user ${alert.user_id} (${alert.item_name})`
        );
      } catch (err) {
        console.warn(
          `[engagement-service] Failed to publish price.alert.triggered event: ${err.message}`
        );
      }
    }

    return triggered;
  },
};
