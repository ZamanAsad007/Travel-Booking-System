import { eventBus } from '../../../../shared/events/eventBus.js';
import { withIdempotency } from '../../../../shared/events/idempotency.js';
import { pool } from '../config/db.js';
import { bookingRepository } from '../repositories/bookingRepository.js';
import { BookingStateMachine, BookingStatus } from '../stateMachine/bookingStateMachine.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export async function startBookingConsumer() {
  const queueName = 'booking-service.payment-events';
  const routingKeys = [EVENTS.PAYMENT_SUCCEEDED, EVENTS.PAYMENT_FAILED];

  const handleEvent = async (event) => {
    const { type, data } = event;
    const { bookingId } = data;
    console.log(`[booking-service] Consumed saga event: ${type} for booking: ${bookingId}`);

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      console.warn(`[booking-service] Booking ${bookingId} not found for event ${type}`);
      return;
    }

    if (type === EVENTS.PAYMENT_SUCCEEDED) {
      // Transition from PENDING to CONFIRMED
      if (BookingStateMachine.canTransition(booking.status, BookingStatus.CONFIRMED)) {
        await bookingRepository.updateStatus(bookingId, BookingStatus.CONFIRMED);
        console.log(`[booking-service] Booking ${bookingId} marked as CONFIRMED`);

        // Publish booking.confirmed so catalog confirms reservations and notification logs/sends
        await eventBus.publish(EVENTS.BOOKING_CONFIRMED, {
          bookingId: booking.id,
          userId: booking.user_id,
          amount: parseFloat(booking.total_amount),
          items: booking.items,
        });
      } else {
        console.warn(`[booking-service] Cannot transition booking ${bookingId} from ${booking.status} to CONFIRMED`);
      }
    } else if (type === EVENTS.PAYMENT_FAILED) {
      // Transition from PENDING to CANCELLED
      if (BookingStateMachine.canTransition(booking.status, BookingStatus.CANCELLED)) {
        await bookingRepository.updateStatus(bookingId, BookingStatus.CANCELLED);
        console.warn(`[booking-service] Booking ${bookingId} marked as CANCELLED due to payment failure`);

        // Publish booking.cancelled so catalog releases holds
        await eventBus.publish(EVENTS.BOOKING_CANCELLED, {
          bookingId: booking.id,
          userId: booking.user_id,
          amount: parseFloat(booking.total_amount),
          items: booking.items,
          reason: data.reason || 'Payment failed',
        });
      } else {
        console.warn(`[booking-service] Cannot transition booking ${bookingId} from ${booking.status} to CANCELLED`);
      }
    }
  };

  try {
    await eventBus.subscribe(queueName, routingKeys, withIdempotency(pool, handleEvent));
    console.log('[booking-service] Saga event consumer started successfully.');
  } catch (err) {
    console.error('[booking-service] Failed to start saga event consumer:', err.message);
  }
}
