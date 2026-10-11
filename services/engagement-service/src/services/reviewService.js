import { reviewRepository } from '../repositories/reviewRepository.js';
import { eventBus } from '../../../../shared/events/eventBus.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export const reviewService = {
  async getReviews({ itemType, itemId, page, limit }) {
    if (!itemType || !itemId) {
      const err = new Error('itemType and itemId query parameters are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    return reviewRepository.findByItem({ itemType, itemId, page, limit });
  },

  async createReview({ userId, userName, bookingId, itemType, itemId, rating, comment }) {
    if (!itemType || !itemId || !bookingId || rating === undefined) {
      const err = new Error('itemType, itemId, bookingId, and rating are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      const err = new Error('Rating must be an integer between 1 and 5');
      err.statusCode = 400;
      err.code = 'INVALID_RATING';
      throw err;
    }

    // Verified traveler check: user must have a confirmed trip record in completed_trips
    const isCompleted = await reviewRepository.hasCompletedTrip(
      userId,
      bookingId,
      itemType,
      itemId
    );
    if (!isCompleted) {
      const err = new Error('Only verified travelers with a completed trip can submit a review');
      err.statusCode = 403;
      err.code = 'UNVERIFIED_TRAVELER';
      throw err;
    }

    // Check if already reviewed
    const alreadyReviewed = await reviewRepository.hasReviewed(userId, bookingId, itemId);
    if (alreadyReviewed) {
      const err = new Error('You have already submitted a review for this trip');
      err.statusCode = 409;
      err.code = 'ALREADY_REVIEWED';
      throw err;
    }

    const review = await reviewRepository.create({
      userId,
      userName,
      bookingId,
      itemType,
      itemId,
      rating: numRating,
      comment,
    });

    // Publish review.created event for other services (e.g. catalog service updates avg_rating)
    try {
      await eventBus.publish(EVENTS.REVIEW_CREATED, {
        reviewId: review.id,
        userId: review.user_id,
        userName: review.user_name,
        bookingId: review.booking_id,
        itemType: review.item_type,
        itemId: review.item_id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
      });
    } catch (e) {
      console.warn('[engagement-service] Could not publish review.created event:', e.message);
    }

    return review;
  },

  async getReviewableTrips(userId) {
    return reviewRepository.findCompletedTrips(userId);
  },
};
