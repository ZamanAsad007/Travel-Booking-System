/**
 * Dynamic Pricing Utility
 * Pure functions to compute dynamic pricing including weekend surcharges,
 * peak season surcharges, traveler scaling, and coupon discounts.
 */

export function isWeekendDay(dateInput) {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const day = d.getUTCDay();
  // Friday (5), Saturday (6), Sunday (0)
  return day === 0 || day === 5 || day === 6;
}

export function getPeakSeason(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const month = d.getUTCMonth(); // 0-indexed: 0 = Jan, 11 = Dec

  // Summer Peak: June (5), July (6), August (7)
  if (month >= 5 && month <= 7) {
    return { name: 'Summer Peak', rate: 0.2 }; // +20%
  }
  // Winter Holiday Peak: December (11)
  if (month === 11) {
    return { name: 'Holiday Peak', rate: 0.25 }; // +25%
  }

  return null;
}

/**
 * Calculates dynamic price for a booking item.
 *
 * @param {Object} item - { price, unitPrice, basePrice, itemType }
 * @param {Object} dates - { departureDate, checkInDate, date }
 * @param {number|Array} travelers - passenger count or travelers array
 * @param {Object} options - { coupon, customWeekendRate, customPeakRate }
 * @returns {Object} breakdown - Detailed pricing breakdown
 */
export function calculatePrice(item = {}, dates = {}, travelers = 1, options = {}) {
  const baseUnitPrice = parseFloat(
    item.price || item.unitPrice || item.unit_price || item.basePrice || 0
  );
  const count = Array.isArray(travelers)
    ? Math.max(1, travelers.length)
    : Math.max(1, parseInt(travelers, 10) || 1);

  const baseTotal = Math.round(baseUnitPrice * count * 100) / 100;

  // Extract reference date for surcharge determination
  const refDate =
    dates.date ||
    dates.departureDate ||
    dates.departure_date ||
    dates.checkInDate ||
    dates.check_in_date ||
    null;

  // 1. Weekend surcharge (default +15%)
  const weekend = isWeekendDay(refDate);
  const weekendRate = options.customWeekendRate !== undefined ? options.customWeekendRate : 0.15;
  const weekendSurcharge = weekend ? Math.round(baseTotal * weekendRate * 100) / 100 : 0;

  // 2. Peak season surcharge (+20% Summer, +25% Winter holidays)
  const peak = getPeakSeason(refDate);
  const peakRate =
    options.customPeakRate !== undefined ? options.customPeakRate : peak ? peak.rate : 0;
  const peakSeasonSurcharge = peakRate > 0 ? Math.round(baseTotal * peakRate * 100) / 100 : 0;

  // 3. Subtotal before coupon
  const subtotal = Math.round((baseTotal + weekendSurcharge + peakSeasonSurcharge) * 100) / 100;

  // 4. Coupon discount
  let discount = 0;
  if (options.coupon) {
    const minAmount = parseFloat(options.coupon.min_amount || options.coupon.minAmount || 0);
    if (subtotal >= minAmount) {
      const type = options.coupon.discount_type || options.coupon.discountType;
      const val = parseFloat(options.coupon.discount_value || options.coupon.discountValue || 0);
      if (type === 'PERCENT') {
        discount = (subtotal * val) / 100;
      } else if (type === 'FLAT') {
        discount = val;
      }
      discount = Math.min(subtotal, Math.round(discount * 100) / 100);
    }
  }

  // 5. Final price
  const finalPrice = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  return {
    unitPrice: baseUnitPrice,
    travelerCount: count,
    baseTotal,
    isWeekend: weekend,
    weekendSurcharge,
    isPeakSeason: !!peak,
    peakSeasonName: peak ? peak.name : null,
    peakSeasonSurcharge,
    subtotal,
    discount,
    finalPrice,
  };
}
