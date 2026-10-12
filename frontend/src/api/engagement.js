import client from './client.js';

export const engagementApi = {
  // Wishlist APIs
  async getWishlist() {
    return client.get('/wishlist');
  },

  async addToWishlist(itemType, itemId) {
    return client.post('/wishlist', { itemType, itemId });
  },

  async removeFromWishlist(itemType, itemId, id = null) {
    if (id) {
      return client.delete(`/wishlist/${id}`);
    }
    return client.delete('/wishlist', { params: { itemType, itemId } });
  },

  // Reviews APIs
  async getReviews(itemType, itemId, page = 1, limit = 10, roomIds = []) {
    const params = { itemType, itemId, page, limit };
    if (roomIds && roomIds.length > 0) {
      params.roomIds = Array.isArray(roomIds) ? roomIds.join(',') : roomIds;
    }
    return client.get('/reviews', { params });
  },

  async createReview({ bookingId, itemType, itemId, rating, comment }) {
    return client.post('/reviews', {
      bookingId,
      itemType,
      itemId,
      rating,
      comment,
    });
  },

  async getEligibleReviewTrips() {
    return client.get('/reviews/eligible');
  },

  // Price Alerts APIs (Phase 18)
  async getPriceAlerts() {
    return client.get('/price-alerts');
  },

  async createPriceAlert({ itemType, itemId, itemName, targetPrice }) {
    return client.post('/price-alerts', {
      itemType,
      itemId,
      itemName,
      targetPrice,
    });
  },

  async deletePriceAlert(id) {
    return client.delete(`/price-alerts/${id}`);
  },

  // Loyalty Points APIs (Phase 19)
  async getLoyaltyProfile() {
    return client.get('/loyalty/me');
  },
};
