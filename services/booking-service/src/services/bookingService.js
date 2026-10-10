import { bookingRepository } from '../repositories/bookingRepository.js';
import { couponRepository } from '../repositories/couponRepository.js';
import { catalogClient } from './catalogClient.js';
import { BookingStateMachine, BookingStatus } from '../stateMachine/bookingStateMachine.js';
import { eventBus } from '../../../../shared/events/eventBus.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export const bookingService = {
  async validateCoupon({ code, userId = null, amount }) {
    if (!code || typeof code !== 'string') {
      return { valid: false, reason: 'Coupon code is required' };
    }

    const coupon = await couponRepository.findByCode(code.trim());
    if (!coupon) {
      return { valid: false, reason: 'Invalid coupon code' };
    }

    if (!coupon.active) {
      return { valid: false, reason: 'Coupon is inactive' };
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { valid: false, reason: 'Coupon is not yet active' };
    }

    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      return { valid: false, reason: 'Coupon has expired' };
    }

    const subtotal = parseFloat(amount || 0);
    const minAmount = parseFloat(coupon.min_amount || 0);
    if (subtotal < minAmount) {
      return {
        valid: false,
        reason: `Minimum booking amount of $${minAmount.toFixed(2)} required for coupon ${coupon.code}`,
      };
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return { valid: false, reason: 'Coupon maximum usage limit has been reached' };
    }

    if (userId) {
      const existingRedemption = await couponRepository.findUserRedemption(coupon.id, userId);
      if (existingRedemption) {
        return { valid: false, reason: 'You have already redeemed this coupon' };
      }
    }

    let discount = 0;
    const discountVal = parseFloat(coupon.discount_value);
    if (coupon.discount_type === 'PERCENT') {
      discount = (subtotal * discountVal) / 100;
    } else if (coupon.discount_type === 'FLAT') {
      discount = discountVal;
    }

    discount = Math.min(subtotal, Math.round(discount * 100) / 100);
    const finalAmount = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: discountVal,
        min_amount: minAmount,
      },
      subtotal,
      discountAmount: discount,
      finalAmount,
    };
  },

  async createBooking({ userId, items, travelers = [], couponCode = null }) {
    if (!items || items.length === 0) {
      const err = new Error('Booking must contain at least one item');
      err.statusCode = 400;
      err.code = 'EMPTY_BOOKING_ITEMS';
      throw err;
    }

    // 1. Verify item availability and retrieve official prices from catalog
    // Price = unit price x travelers (if travelers provided)
    const travelerCount = travelers && travelers.length > 0 ? travelers.length : null;
    const validatedItems = [];
    let subtotalAmount = 0;

    for (const item of items) {
      const quantity = travelerCount !== null ? travelerCount : item.quantity || 1;
      const check = await catalogClient.checkAvailability(item.itemType, item.itemId, quantity);
      if (!check.available) {
        const err = new Error(
          `Item ${item.itemId} (${item.itemType}) is unavailable or has insufficient capacity`
        );
        err.statusCode = 409;
        err.code = 'ITEM_UNAVAILABLE';
        throw err;
      }

      const unitPrice = parseFloat(check.unitPrice);
      const subtotal = unitPrice * quantity;
      subtotalAmount += subtotal;

      validatedItems.push({
        ...item,
        quantity,
        unitPrice,
      });
    }

    let totalAmount = subtotalAmount;
    let validatedCoupon = null;
    let discountAmount = 0;

    if (couponCode) {
      const couponCheck = await this.validateCoupon({
        code: couponCode,
        userId,
        amount: subtotalAmount,
      });
      if (!couponCheck.valid) {
        const err = new Error(couponCheck.reason || 'Invalid coupon');
        err.statusCode = 400;
        err.code = 'INVALID_COUPON';
        throw err;
      }
      validatedCoupon = couponCheck.coupon;
      discountAmount = couponCheck.discountAmount;
      totalAmount = couponCheck.finalAmount;
    }

    // 2. Persist booking initially in PENDING status with atomic coupon handling
    const booking = await bookingRepository.createBooking({
      userId,
      totalAmount,
      status: BookingStatus.PENDING,
      items: validatedItems,
      travelers,
      couponCode: validatedCoupon?.code || null,
      discountAmount,
      couponId: validatedCoupon?.id || null,
    });

    try {
      // 3. Ask catalog service to create temporary inventory holds in Redis with TTL (10 min)
      for (const item of validatedItems) {
        await catalogClient.createHold({
          itemType: item.itemType,
          itemId: item.itemId,
          bookingId: booking.id,
          quantity: item.quantity,
          ttlSeconds: 600,
        });
      }

      // 4. Publish booking.created event to RabbitMQ topic exchange
      await eventBus.publish(EVENTS.BOOKING_CREATED, {
        bookingId: booking.id,
        userId: booking.user_id,
        amount: parseFloat(booking.total_amount),
        items: validatedItems,
        travelers: booking.travelers || [],
        couponCode: booking.coupon_code || null,
        discountAmount: parseFloat(booking.discount_amount || 0),
      });

      console.log(`[booking-service] Booking ${booking.id} created and event published (PENDING)`);

      return booking;
    } catch (err) {
      // If holding or event publishing fails, clean up and cancel booking, release coupon
      await catalogClient.releaseHold(booking.id);
      await couponRepository.releaseByBookingId(booking.id).catch(() => {});
      await bookingRepository.updateStatus(booking.id, BookingStatus.CANCELLED);
      throw err;
    }
  },

  async getUserBookings(userId) {
    return bookingRepository.findByUserId(userId);
  },

  async getBookingById(id, userId, userRole = 'user') {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      err.code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (booking.user_id !== userId && userRole !== 'admin') {
      const err = new Error('Access denied: You do not have permission to view this booking');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return booking;
  },

  async cancelBooking(id, userId, userRole = 'user') {
    const booking = await this.getBookingById(id, userId, userRole);

    // Validate state machine transition
    BookingStateMachine.validateTransition(booking.status, BookingStatus.CANCELLED);

    // Release Redis hold and any reservation
    await catalogClient.releaseHold(id);

    // Release any redeemed coupon
    await couponRepository.releaseByBookingId(id).catch(() => {});

    // Update status to CANCELLED
    const updated = await bookingRepository.updateStatus(id, BookingStatus.CANCELLED);

    // Publish booking.cancelled event so payment (refund) and catalog receive notification
    await eventBus.publish(EVENTS.BOOKING_CANCELLED, {
      bookingId: id,
      userId: booking.user_id,
      amount: parseFloat(booking.total_amount),
      items: booking.items,
    });

    console.log(`[booking-service] Booking ${id} cancelled and event published`);

    return {
      ...booking,
      status: updated.status,
      updated_at: updated.updated_at,
    };
  },

  async getAllBookings(params) {
    return bookingRepository.findAll(params);
  },

  async getStats() {
    return bookingRepository.getStats();
  },

  async getAllCoupons(params) {
    return couponRepository.findAll(params);
  },

  async createCoupon(data) {
    return couponRepository.create(data);
  },

  async updateCoupon(id, data) {
    return couponRepository.update(id, data);
  },

  async deleteCoupon(id) {
    return couponRepository.delete(id);
  },
};
