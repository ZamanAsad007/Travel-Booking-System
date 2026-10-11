import { reviewService } from '../services/reviewService.js';
import { successResponse, errorResponse } from '../../../../shared/utils/response.js';

export const reviewController = {
  async getReviews(req, res) {
    try {
      const { itemType, itemId, page, limit } = req.query;
      const data = await reviewService.getReviews({
        itemType,
        itemId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      });
      return successResponse(res, data);
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },

  async createReview(req, res) {
    try {
      const { bookingId, itemType, itemId, rating, comment } = req.body;
      const userName = req.user.name || req.user.email?.split('@')[0] || 'Traveler';

      const review = await reviewService.createReview({
        userId: req.user.id,
        userName,
        bookingId,
        itemType,
        itemId,
        rating,
        comment,
      });

      return successResponse(res, review, 201);
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },

  async getReviewableTrips(req, res) {
    try {
      const trips = await reviewService.getReviewableTrips(req.user.id);
      return successResponse(res, trips);
    } catch (err) {
      return errorResponse(res, err.message, err.code || 'INTERNAL_ERROR', err.statusCode || 500);
    }
  },
};
