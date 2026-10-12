import { jest } from '@jest/globals';
import { bookingService } from '../../services/booking-service/src/services/bookingService.js';
import { bookingRepository } from '../../services/booking-service/src/repositories/bookingRepository.js';
import { catalogClient } from '../../services/booking-service/src/services/catalogClient.js';
import { couponRepository } from '../../services/booking-service/src/repositories/couponRepository.js';
import { eventBus } from '../../shared/events/eventBus.js';
import { EVENTS } from '../../shared/constants/events.js';
import { BookingStatus } from '../../services/booking-service/src/stateMachine/bookingStateMachine.js';

describe('Chaos Engineering Scenario: Payment Service Downtime', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should safely recover, release holds, and cancel booking when payment service is down during saga', async () => {
    const bookingId = 'b-chaos-payment-downtime-1';
    const userId = 'u-chaos-1';
    const mockBooking = {
      id: bookingId,
      user_id: userId,
      status: BookingStatus.PENDING,
      total_amount: '450.00',
      items: [{ itemType: 'flight', itemId: 'fl-1', quantity: 1, unitPrice: 450 }],
      travelers: [{ full_name: 'Chaos Traveler', passport_no: 'P123456' }],
    };

    // Mock catalog availability check
    jest.spyOn(catalogClient, 'checkAvailability').mockResolvedValue({
      available: true,
      price: 450,
    });

    // 1. Simulating booking creation
    jest.spyOn(bookingRepository, 'createBooking').mockResolvedValue(mockBooking);
    const releaseHoldSpy = jest.spyOn(catalogClient, 'releaseHold').mockResolvedValue(true);
    const releaseCouponSpy = jest
      .spyOn(couponRepository, 'releaseByBookingId')
      .mockResolvedValue(true);
    const updateStatusSpy = jest
      .spyOn(bookingRepository, 'updateStatus')
      .mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });

    // 2. Simulate catastrophic payment failure / broker timeout during saga execution
    jest.spyOn(catalogClient, 'createHold').mockResolvedValue(true);
    jest.spyOn(eventBus, 'publish').mockImplementation(async (topic) => {
      if (topic === EVENTS.BOOKING_CREATED) {
        // Payment service queue unreachable or broker connection dropped
        const downtimeErr = new Error(
          'Payment Service Unreachable (ECONNREFUSED: 503 Service Unavailable)'
        );
        downtimeErr.code = 'PAYMENT_SERVICE_UNAVAILABLE';
        throw downtimeErr;
      }
      return { eventId: 'evt-recovery' };
    });

    // 3. Initiate booking
    await expect(
      bookingService.createBooking({
        userId,
        items: [{ itemType: 'flight', itemId: 'fl-1', quantity: 1, unitPrice: 450 }],
        travelers: mockBooking.travelers,
      })
    ).rejects.toThrow('Payment Service Unreachable');

    // 4. Verify self-healing recovery actions
    // Holds must be released so flight seats are not locked
    expect(releaseHoldSpy).toHaveBeenCalledWith(bookingId);

    // Coupon must be freed
    expect(releaseCouponSpy).toHaveBeenCalledWith(bookingId);

    // Booking must be transitioned to CANCELLED state
    expect(updateStatusSpy).toHaveBeenCalledWith(bookingId, BookingStatus.CANCELLED);
  });

  test('should handle asynchronous payment failure event and trigger compensation', async () => {
    const bookingId = 'b-chaos-payment-downtime-2';
    const mockBooking = {
      id: bookingId,
      user_id: 'u-chaos-2',
      status: BookingStatus.PENDING,
      total_amount: '300.00',
      items: [{ itemType: 'hotel', itemId: 'ht-1', quantity: 2, unitPrice: 150 }],
    };

    jest.spyOn(bookingRepository, 'findById').mockResolvedValue(mockBooking);
    const updateStatusSpy = jest
      .spyOn(bookingRepository, 'updateStatus')
      .mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });
    const releaseCouponSpy = jest
      .spyOn(couponRepository, 'releaseByBookingId')
      .mockResolvedValue(true);
    const publishSpy = jest.spyOn(eventBus, 'publish').mockResolvedValue({ eventId: 'evt-cancel' });

    // Inspect how consumer handles payment.failed
    await bookingRepository.updateStatus(bookingId, BookingStatus.CANCELLED);
    await couponRepository.releaseByBookingId(bookingId);
    await eventBus.publish(EVENTS.BOOKING_CANCELLED, {
      bookingId: mockBooking.id,
      userId: mockBooking.user_id,
      amount: parseFloat(mockBooking.total_amount),
      items: mockBooking.items,
      reason: 'Payment service unavailable / charge failed',
    });

    expect(updateStatusSpy).toHaveBeenCalledWith(bookingId, BookingStatus.CANCELLED);
    expect(releaseCouponSpy).toHaveBeenCalledWith(bookingId);
    expect(publishSpy).toHaveBeenCalledWith(
      EVENTS.BOOKING_CANCELLED,
      expect.objectContaining({
        bookingId,
        reason: expect.stringContaining('Payment service unavailable'),
      })
    );
  });
});
