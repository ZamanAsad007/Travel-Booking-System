import { jest } from '@jest/globals';
import {
  computeTier,
  getTierDetails,
  loyaltyRepository,
} from '../../services/engagement-service/src/repositories/loyaltyRepository.js';
import { loyaltyService } from '../../services/engagement-service/src/services/loyaltyService.js';
import { eventBus } from '../../shared/events/eventBus.js';
import { EVENTS } from '../../shared/constants/events.js';

describe('Loyalty Points & Tier System Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('computeTier', () => {
    it('should assign BRONZE for 0 to 499 lifetime points', () => {
      expect(computeTier(0)).toBe('BRONZE');
      expect(computeTier(100)).toBe('BRONZE');
      expect(computeTier(499)).toBe('BRONZE');
    });

    it('should assign SILVER for 500 to 1999 lifetime points', () => {
      expect(computeTier(500)).toBe('SILVER');
      expect(computeTier(1200)).toBe('SILVER');
      expect(computeTier(1999)).toBe('SILVER');
    });

    it('should assign GOLD for 2000+ lifetime points', () => {
      expect(computeTier(2000)).toBe('GOLD');
      expect(computeTier(5500)).toBe('GOLD');
    });
  });

  describe('getTierDetails', () => {
    it('should calculate correct progress for BRONZE tier', () => {
      const details = getTierDetails('BRONZE', 250);
      expect(details.currentTier).toBe('BRONZE');
      expect(details.nextTier).toBe('SILVER');
      expect(details.pointsToNextTier).toBe(250);
      expect(details.progressPercentage).toBe(50);
    });

    it('should calculate correct progress for SILVER tier', () => {
      const details = getTierDetails('SILVER', 1250);
      expect(details.currentTier).toBe('SILVER');
      expect(details.nextTier).toBe('GOLD');
      expect(details.pointsToNextTier).toBe(750);
      expect(details.progressPercentage).toBe(50);
    });

    it('should cap progress at 100% with no next tier for GOLD', () => {
      const details = getTierDetails('GOLD', 3000);
      expect(details.currentTier).toBe('GOLD');
      expect(details.nextTier).toBeNull();
      expect(details.pointsToNextTier).toBe(0);
      expect(details.progressPercentage).toBe(100);
    });
  });

  describe('loyaltyService event handlers', () => {
    it('should award points and publish loyalty.points.earned on booking.confirmed', async () => {
      const mockResult = {
        account: {
          user_id: 'u-1',
          points_balance: 150,
          lifetime_points: 150,
          tier: 'BRONZE',
        },
        ledgerEntry: {
          id: 'led-1',
          user_id: 'u-1',
          points: 50,
        },
      };

      const addLedgerSpy = jest
        .spyOn(loyaltyRepository, 'addLedgerEntry')
        .mockResolvedValue(mockResult);

      const publishSpy = jest
        .spyOn(eventBus, 'publish')
        .mockResolvedValue({ eventId: 'evt-1' });

      const res = await loyaltyService.handleBookingConfirmed({
        userId: 'u-1',
        bookingId: 'b-12345678-abcd',
        totalAmount: 500,
      });

      expect(addLedgerSpy).toHaveBeenCalledWith({
        userId: 'u-1',
        bookingId: 'b-12345678-abcd',
        points: 50, // 500 / 10
        reason: 'Booking #b-123456 confirmed',
      });

      expect(publishSpy).toHaveBeenCalledWith(
        EVENTS.LOYALTY_POINTS_EARNED,
        expect.objectContaining({
          userId: 'u-1',
          bookingId: 'b-12345678-abcd',
          pointsEarned: 50,
          pointsBalance: 150,
          tier: 'BRONZE',
        })
      );
    });

    it('should reverse points and publish loyalty.points.deducted on booking.cancelled', async () => {
      jest
        .spyOn(loyaltyRepository, 'hasBookingPoints')
        .mockResolvedValue({ id: 'led-1', points: 50 });

      const mockResult = {
        account: {
          user_id: 'u-1',
          points_balance: 100,
          lifetime_points: 150,
          tier: 'BRONZE',
        },
        ledgerEntry: {
          id: 'led-2',
          user_id: 'u-1',
          points: -50,
        },
      };

      const addLedgerSpy = jest
        .spyOn(loyaltyRepository, 'addLedgerEntry')
        .mockResolvedValue(mockResult);

      const publishSpy = jest
        .spyOn(eventBus, 'publish')
        .mockResolvedValue({ eventId: 'evt-2' });

      await loyaltyService.handleBookingCancelled({
        userId: 'u-1',
        bookingId: 'b-12345678-abcd',
      });

      expect(addLedgerSpy).toHaveBeenCalledWith({
        userId: 'u-1',
        bookingId: 'b-12345678-abcd',
        points: -50,
        reason: 'Booking #b-123456 cancelled (reversal)',
      });

      expect(publishSpy).toHaveBeenCalledWith(
        EVENTS.LOYALTY_POINTS_DEDUCTED,
        expect.objectContaining({
          userId: 'u-1',
          bookingId: 'b-12345678-abcd',
          pointsDeducted: 50,
          pointsBalance: 100,
          tier: 'BRONZE',
        })
      );
    });

    it('should create loyalty account with welcome bonus on user.registered', async () => {
      jest.spyOn(loyaltyRepository, 'getAccount').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(loyaltyRepository, 'createAccount')
        .mockResolvedValue({
          user_id: 'u-2',
          points_balance: 100,
          tier: 'BRONZE',
        });

      await loyaltyService.handleUserRegistered({
        userId: 'u-2',
        email: 'newuser@travel.com',
      });

      expect(createSpy).toHaveBeenCalledWith({
        userId: 'u-2',
        email: 'newuser@travel.com',
        initialPoints: 100,
      });
    });
  });
});
