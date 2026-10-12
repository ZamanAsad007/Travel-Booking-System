import { loyaltyRepository } from '../repositories/loyaltyRepository.js';
import { eventBus } from '../../../../shared/events/eventBus.js';
import { EVENTS } from '../../../../shared/constants/events.js';

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

    const account = await loyaltyRepository.createAccount({
      userId,
      email,
      initialPoints: 100, // Welcome bonus
    });

    console.log(
      `[engagement-service] Loyalty account created with 100 welcome bonus for user ${userId}`
    );
    return account;
  },

  async handleBookingConfirmed(data) {
    const { userId, bookingId, totalAmount } = data;
    if (!userId || !bookingId) return null;

    // 1 point per 10 currency units
    const earnedPoints = Math.max(1, Math.floor(Number(totalAmount || 0) / 10));

    const result = await loyaltyRepository.addLedgerEntry({
      userId,
      bookingId,
      points: earnedPoints,
      reason: `Booking #${bookingId.slice(0, 8)} confirmed`,
    });

    try {
      await eventBus.publish(EVENTS.LOYALTY_POINTS_EARNED, {
        userId,
        bookingId,
        pointsEarned: earnedPoints,
        pointsBalance: result.account.points_balance,
        lifetimePoints: result.account.lifetime_points,
        tier: result.account.tier,
      });
      console.log(
        `[engagement-service] Published loyalty.points.earned for booking ${bookingId}: +${earnedPoints} pts`
      );
    } catch (publishErr) {
      console.error(
        '[engagement-service] Failed to publish loyalty.points.earned:',
        publishErr.message
      );
    }

    return result;
  },

  async handleBookingCancelled(data) {
    const { userId, bookingId } = data;
    if (!userId || !bookingId) return null;

    // Check if points were awarded for this booking
    const originalEntry = await loyaltyRepository.hasBookingPoints(bookingId);
    if (!originalEntry) {
      console.log(
        `[engagement-service] No positive points found to reverse for booking ${bookingId}`
      );
      return null;
    }

    const pointsToDeduct = -Math.abs(originalEntry.points);

    const result = await loyaltyRepository.addLedgerEntry({
      userId,
      bookingId,
      points: pointsToDeduct,
      reason: `Booking #${bookingId.slice(0, 8)} cancelled (reversal)`,
    });

    try {
      await eventBus.publish(EVENTS.LOYALTY_POINTS_DEDUCTED, {
        userId,
        bookingId,
        pointsDeducted: Math.abs(pointsToDeduct),
        pointsBalance: result.account.points_balance,
        lifetimePoints: result.account.lifetime_points,
        tier: result.account.tier,
      });
      console.log(
        `[engagement-service] Published loyalty.points.deducted for booking ${bookingId}: ${pointsToDeduct} pts`
      );
    } catch (publishErr) {
      console.error(
        '[engagement-service] Failed to publish loyalty.points.deducted:',
        publishErr.message
      );
    }

    return result;
  },
};
