import { bookingRepository } from '../repositories/bookingRepository.js';
import { catalogClient } from './catalogClient.js';
import { BookingStateMachine, BookingStatus } from '../stateMachine/bookingStateMachine.js';

export const bookingService = {
  async createBooking({ userId, items }) {
    if (!items || items.length === 0) {
      const err = new Error('Booking must contain at least one item');
      err.statusCode = 400;
      err.code = 'EMPTY_BOOKING_ITEMS';
      throw err;
    }

    // 1. Verify item availability and retrieve official prices from catalog
    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const check = await catalogClient.checkAvailability(item.itemType, item.itemId, item.quantity);
      if (!check.available) {
        const err = new Error(
          `Item ${item.itemId} (${item.itemType}) is unavailable or has insufficient capacity`
        );
        err.statusCode = 409;
        err.code = 'ITEM_UNAVAILABLE';
        throw err;
      }

      const unitPrice = parseFloat(check.unitPrice);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        ...item,
        unitPrice,
      });
    }

    // 2. Persist booking initially in PENDING status
    const booking = await bookingRepository.createBooking({
      userId,
      totalAmount,
      status: BookingStatus.PENDING,
      items: validatedItems,
    });

    try {
      // 3. Reserve inventory in catalog service over HTTP
      for (const item of validatedItems) {
        await catalogClient.reserveItem({
          itemType: item.itemType,
          itemId: item.itemId,
          bookingId: booking.id,
          quantity: item.quantity,
          dateFrom: item.dateFrom,
          dateTo: item.dateTo,
        });
      }

      // 4. In synchronous phase, transition to CONFIRMED once reservations succeed
      BookingStateMachine.validateTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED);
      const confirmedBooking = await bookingRepository.updateStatus(booking.id, BookingStatus.CONFIRMED);

      return {
        ...booking,
        status: confirmedBooking.status,
        updated_at: confirmedBooking.updated_at,
      };
    } catch (err) {
      // If reservation fails, transition to CANCELLED and release
      await catalogClient.releaseReservation(booking.id);
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

    // Release catalog reservation over HTTP
    await catalogClient.releaseReservation(id);

    // Update status to CANCELLED
    const updated = await bookingRepository.updateStatus(id, BookingStatus.CANCELLED);

    return {
      ...booking,
      status: updated.status,
      updated_at: updated.updated_at,
    };
  },
};
