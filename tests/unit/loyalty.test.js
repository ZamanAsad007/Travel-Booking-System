import { jest } from '@jest/globals';
import { computeTier, getTierDetails } from '../../services/engagement-service/src/repositories/loyaltyRepository.js';

describe('Loyalty Points & Tier System Unit Tests', () => {
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
      // 500 is start, 2000 is gold (range 1500). If lifetime is 1250, (1250 - 500)/1500 = 750/1500 = 50%
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
});
