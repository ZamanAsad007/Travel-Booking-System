import { wishlistService } from '../services/wishlistService.js';
import { successResponse, errorResponse } from '../../../../shared/utils/response.js';

export const wishlistController = {
  async getWishlist(req, res) {
    try {
      const items = await wishlistService.getWishlist(req.user.id);
      return successResponse(res, items);
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },

  async addToWishlist(req, res) {
    try {
      const { itemType, itemId } = req.body;
      if (!itemType || !itemId) {
        return errorResponse(res, 'itemType and itemId are required', 'VALIDATION_ERROR', 400);
      }
      const item = await wishlistService.addToWishlist(req.user.id, itemType, itemId);
      return successResponse(res, item, 201);
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },

  async removeFromWishlist(req, res) {
    try {
      const { id } = req.params;
      const { itemType, itemId } = req.query;

      if (id) {
        await wishlistService.removeById(req.user.id, id);
      } else if (itemType && itemId) {
        await wishlistService.removeFromWishlist(req.user.id, itemType, itemId);
      } else {
        return errorResponse(
          res,
          'Provide wishlist id or itemType and itemId',
          'VALIDATION_ERROR',
          400
        );
      }

      return successResponse(res, { removed: true });
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },
};
