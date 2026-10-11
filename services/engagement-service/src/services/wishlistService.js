import { wishlistRepository } from '../repositories/wishlistRepository.js';

export const wishlistService = {
  async getWishlist(userId) {
    return wishlistRepository.findByUser(userId);
  },

  async addToWishlist(userId, itemType, itemId) {
    if (!itemType || !itemId) {
      const err = new Error('itemType and itemId are required');
      err.statusCode = 400;
      throw err;
    }
    return wishlistRepository.add({ userId, itemType, itemId });
  },

  async removeFromWishlist(userId, itemType, itemId) {
    return wishlistRepository.remove({ userId, itemType, itemId });
  },

  async removeById(userId, wishlistId) {
    return wishlistRepository.removeById(userId, wishlistId);
  },
};
