import { priceAlertService } from '../services/priceAlertService.js';
import { successResponse, errorResponse } from '../../../../shared/utils/response.js';

export const priceAlertController = {
  async getAlerts(req, res) {
    try {
      const alerts = await priceAlertService.getUserAlerts(req.user.id);
      return successResponse(res, alerts);
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },

  async createAlert(req, res) {
    try {
      const { itemType, itemId, itemName, targetPrice } = req.body;
      const alert = await priceAlertService.createAlert({
        userId: req.user.id,
        userEmail: req.user.email,
        itemType,
        itemId,
        itemName,
        targetPrice,
      });
      return successResponse(res, alert, 201);
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },

  async deleteAlert(req, res) {
    try {
      const { id } = req.params;
      const deleted = await priceAlertService.deleteAlert(req.user.id, id);
      return successResponse(res, { deleted });
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },
};
