import { calculatePrice, isWeekendDay, getPeakSeason } from '../../shared/utils/pricing.js';

describe('Dynamic Pricing Unit Tests', () => {
  describe('isWeekendDay', () => {
    test('should identify Friday, Saturday, and Sunday as weekend days', () => {
      // 2026-07-10 is Friday
      expect(isWeekendDay('2026-07-10T10:00:00Z')).toBe(true);
      // 2026-07-11 is Saturday
      expect(isWeekendDay('2026-07-11T12:00:00Z')).toBe(true);
      // 2026-07-12 is Sunday
      expect(isWeekendDay('2026-07-12T15:00:00Z')).toBe(true);
    });

    test('should identify Monday through Thursday as weekdays', () => {
      // 2026-07-13 is Monday
      expect(isWeekendDay('2026-07-13T09:00:00Z')).toBe(false);
      // 2026-07-15 is Wednesday
      expect(isWeekendDay('2026-07-15T10:00:00Z')).toBe(false);
    });

    test('should handle invalid or missing dates gracefully', () => {
      expect(isWeekendDay(null)).toBe(false);
      expect(isWeekendDay(undefined)).toBe(false);
      expect(isWeekendDay('invalid-date')).toBe(false);
    });
  });

  describe('getPeakSeason', () => {
    test('should return Summer Peak for June, July, and August', () => {
      expect(getPeakSeason('2026-06-15T12:00:00Z')).toEqual({
        name: 'Summer Peak',
        rate: 0.2,
      });
      expect(getPeakSeason('2026-07-20T12:00:00Z')).toEqual({
        name: 'Summer Peak',
        rate: 0.2,
      });
      expect(getPeakSeason('2026-08-30T12:00:00Z')).toEqual({
        name: 'Summer Peak',
        rate: 0.2,
      });
    });

    test('should return Holiday Peak for December', () => {
      expect(getPeakSeason('2026-12-25T12:00:00Z')).toEqual({
        name: 'Holiday Peak',
        rate: 0.25,
      });
    });

    test('should return null for off-peak months', () => {
      expect(getPeakSeason('2026-03-15T12:00:00Z')).toBeNull();
      expect(getPeakSeason('2026-10-10T12:00:00Z')).toBeNull();
    });
  });

  describe('calculatePrice', () => {
    test('should calculate standard price for single traveler on weekday off-peak', () => {
      // 2026-03-11 is Wednesday (off-peak weekday)
      const res = calculatePrice({ price: 100 }, { departureDate: '2026-03-11T10:00:00Z' }, 1);

      expect(res.baseTotal).toBe(100);
      expect(res.isWeekend).toBe(false);
      expect(res.weekendSurcharge).toBe(0);
      expect(res.isPeakSeason).toBe(false);
      expect(res.peakSeasonSurcharge).toBe(0);
      expect(res.subtotal).toBe(100);
      expect(res.finalPrice).toBe(100);
    });

    test('should scale price accurately with multiple travelers', () => {
      const travelers = [
        { full_name: 'Traveler 1' },
        { full_name: 'Traveler 2' },
        { full_name: 'Traveler 3' },
      ];

      const res = calculatePrice(
        { price: 250 },
        { departureDate: '2026-03-11T10:00:00Z' },
        travelers
      );

      expect(res.travelerCount).toBe(3);
      expect(res.baseTotal).toBe(750);
      expect(res.subtotal).toBe(750);
      expect(res.finalPrice).toBe(750);
    });

    test('should apply 15% weekend surcharge on Friday/Saturday/Sunday', () => {
      // 2026-03-14 is Saturday
      const res = calculatePrice({ price: 200 }, { departureDate: '2026-03-14T10:00:00Z' }, 1);

      expect(res.isWeekend).toBe(true);
      expect(res.weekendSurcharge).toBe(30); // 15% of 200
      expect(res.subtotal).toBe(230);
      expect(res.finalPrice).toBe(230);
    });

    test('should apply 20% peak season surcharge in July', () => {
      // 2026-07-15 is Wednesday (weekday in Summer peak)
      const res = calculatePrice({ price: 200 }, { departureDate: '2026-07-15T10:00:00Z' }, 1);

      expect(res.isWeekend).toBe(false);
      expect(res.isPeakSeason).toBe(true);
      expect(res.peakSeasonName).toBe('Summer Peak');
      expect(res.peakSeasonSurcharge).toBe(40); // 20% of 200
      expect(res.subtotal).toBe(240);
      expect(res.finalPrice).toBe(240);
    });

    test('should apply combined weekend and peak season surcharges', () => {
      // 2026-07-11 is Saturday (Summer peak weekend)
      const res = calculatePrice(
        { price: 200 },
        { departureDate: '2026-07-11T10:00:00Z' },
        2 // 2 travelers: baseTotal = 400
      );

      expect(res.baseTotal).toBe(400);
      expect(res.isWeekend).toBe(true);
      expect(res.weekendSurcharge).toBe(60); // 15% of 400
      expect(res.isPeakSeason).toBe(true);
      expect(res.peakSeasonSurcharge).toBe(80); // 20% of 400
      expect(res.subtotal).toBe(540); // 400 + 60 + 80
      expect(res.finalPrice).toBe(540);
    });

    test('should apply percentage coupon discount correctly', () => {
      const res = calculatePrice(
        { price: 100 },
        { departureDate: '2026-03-11T10:00:00Z' },
        2, // subtotal = 200
        {
          coupon: {
            discount_type: 'PERCENT',
            discount_value: 15,
            min_amount: 50,
          },
        }
      );

      expect(res.subtotal).toBe(200);
      expect(res.discount).toBe(30); // 15% of 200
      expect(res.finalPrice).toBe(170);
    });

    test('should apply flat coupon discount correctly', () => {
      const res = calculatePrice({ price: 300 }, { departureDate: '2026-03-11T10:00:00Z' }, 1, {
        coupon: {
          discount_type: 'FLAT',
          discount_value: 50,
          min_amount: 100,
        },
      });

      expect(res.subtotal).toBe(300);
      expect(res.discount).toBe(50);
      expect(res.finalPrice).toBe(250);
    });

    test('should not apply coupon if subtotal is below minimum amount', () => {
      const res = calculatePrice({ price: 80 }, { departureDate: '2026-03-11T10:00:00Z' }, 1, {
        coupon: {
          discount_type: 'FLAT',
          discount_value: 20,
          min_amount: 100,
        },
      });

      expect(res.subtotal).toBe(80);
      expect(res.discount).toBe(0);
      expect(res.finalPrice).toBe(80);
    });

    test('should not result in negative finalPrice when discount exceeds subtotal', () => {
      const res = calculatePrice({ price: 50 }, { departureDate: '2026-03-11T10:00:00Z' }, 1, {
        coupon: {
          discount_type: 'FLAT',
          discount_value: 100,
          min_amount: 20,
        },
      });

      expect(res.subtotal).toBe(50);
      expect(res.discount).toBe(50); // Capped at subtotal
      expect(res.finalPrice).toBe(0);
    });
  });
});
