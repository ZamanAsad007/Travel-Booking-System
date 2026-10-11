import { loyaltyService } from '../services/loyaltyService.js';
import { loyaltyRepository } from '../repositories/loyaltyRepository.js';
import { successResponse } from '../../../../shared/utils/response.js';

export const loyaltyController = {
  async getMyLoyalty(req, res, next) {
    try {
      const profile = await loyaltyService.getLoyaltyProfile(req.user.id, req.user.email);
      return successResponse(res, profile, 200);
    } catch (err) {
      next(err);
    }
  },

  async getLedger(req, res, next) {
    try {
      const ledger = await loyaltyRepository.getLedger(req.user.id);
      return successResponse(res, ledger, 200);
    } catch (err) {
      next(err);
    }
  },
};
