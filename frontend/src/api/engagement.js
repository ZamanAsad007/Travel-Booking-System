import client from './client.js';

export const engagementApi = {
  // Wishlist APIs
  async getWishlist() {
    const res = await client.get('/wishlist');
    return res.data;
  },

  async addToWishlist(itemType, itemId) {
    const res = await client.post('/wishlist', { itemType, itemId });
    return res.data;
  },

  async removeFromWishlist(itemType, itemId, id = null) {
    if (id) {
      const res = await client.delete(`/wishlist/${id}`);
      return res.data;
    }
    const res = await client.delete('/wishlist', { params: { itemType, itemId } });
    return res.data;
  },

  // Reviews APIs
  async getReviews(itemType, itemId, page = 1, limit = 10) {
    const res = await client.get('/reviews', {
      params: { itemType, itemId, page, limit },
    });
    return res.data;
  },

  async createReview({ bookingId, itemType, itemId, rating, comment }) {
    const res = await client.post('/reviews', {
      bookingId,
      itemType,
      itemId,
      rating,
      comment,
    });
    return res.data;
  },

  async getEligibleReviewTrips() {
    const res = await client.get('/reviews/eligible');
    return res.data;
  },

  // Price Alerts APIs (Phase 18)
  async getPriceAlerts() {
    const res = await client.get('/price-alerts');
    return res.data;
  },

  async createPriceAlert({ itemType, itemId, itemName, targetPrice }) {
    const res = await client.post('/price-alerts', {
      itemType,
      itemId,
      itemName,
      targetPrice,
    });
    return res.data;
  },

  async deletePriceAlert(id) {
    const res = await client.delete(`/price-alerts/${id}`);
    return res.data;
  },

  // Loyalty Points APIs (Phase 19)
  async getLoyaltyProfile() {
    const res = await client.get('/loyalty/me');
    return res.data;
  },
};
