import { loyaltyRepository } from '../repositories/loyaltyRepository.js';

export const loyaltyService = {
  async getLoyaltyProfile(userId, email) {
    let account = await loyaltyRepository.getAccount(userId);
    if (!account) {
      account = await loyaltyRepository.createAccount({
        userId,
        email,
        initialPoints: 100, // Welcome bonus
      });
    }

    const ledger = await loyaltyRepository.getLedger(userId);
    const tierInfo = loyaltyRepository.getTierDetails(account.tier, account.lifetime_points);

    return {
      account,
      tierInfo,
      ledger,
    };
  },

  async handleUserRegistered(data) {
    const { userId, email } = data;
    if (!userId) return null;

    const existing = await loyaltyRepository.getAccount(userId);
    if (existing) return existing;

    return await loyaltyRepository.createAccount({
      userId,
      email,
      initialPoints: 100, // Welcome bonus
    });
  },

  async handleBookingConfirmed(data) {
    const { userId, bookingId, totalAmount } = data;
    if (!userId || !bookingId) return null;

    // 1 point per 10 currency units
    const earnedPoints = Math.max(1, Math.floor(Number(totalAmount || 0) / 10));

    return await loyaltyRepository.addLedgerEntry({
      userId,
      bookingId,
      points: earnedPoints,
      reason: `Booking #${bookingId.slice(0, 8)} confirmed`,
    });
  },

  async handleBookingCancelled(data) {
    const { userId, bookingId } = data;
    if (!userId || !bookingId) return null;

    // Check if points were awarded for this booking
    const originalEntry = await loyaltyRepository.hasBookingPoints(bookingId);
    if (!originalEntry) return null;

    const pointsToDeduct = -Math.abs(originalEntry.points);

    return await loyaltyRepository.addLedgerEntry({
      userId,
      bookingId,
      points: pointsToDeduct,
      reason: `Booking #${bookingId.slice(0, 8)} cancelled (reversal)`,
    });
  },
};
