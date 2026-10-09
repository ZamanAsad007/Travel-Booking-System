import {
  BookingStateMachine,
  BookingStatus,
} from '../../services/booking-service/src/stateMachine/bookingStateMachine.js';

describe('BookingStateMachine Unit Tests', () => {
  describe('canTransition', () => {
    test('should allow transition from PENDING to CONFIRMED', () => {
      expect(
        BookingStateMachine.canTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED)
      ).toBe(true);
    });

    test('should allow transition from PENDING to CANCELLED', () => {
      expect(
        BookingStateMachine.canTransition(BookingStatus.PENDING, BookingStatus.CANCELLED)
      ).toBe(true);
    });

    test('should allow transition from PENDING to EXPIRED', () => {
      expect(BookingStateMachine.canTransition(BookingStatus.PENDING, BookingStatus.EXPIRED)).toBe(
        true
      );
    });

    test('should allow transition from CONFIRMED to CANCELLED (user cancellation)', () => {
      expect(
        BookingStateMachine.canTransition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)
      ).toBe(true);
    });

    test('should NOT allow transition from CONFIRMED back to PENDING', () => {
      expect(
        BookingStateMachine.canTransition(BookingStatus.CONFIRMED, BookingStatus.PENDING)
      ).toBe(false);
    });

    test('should NOT allow transition from CANCELLED to CONFIRMED', () => {
      expect(
        BookingStateMachine.canTransition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED)
      ).toBe(false);
    });

    test('should NOT allow transition from CANCELLED to PENDING', () => {
      expect(
        BookingStateMachine.canTransition(BookingStatus.CANCELLED, BookingStatus.PENDING)
      ).toBe(false);
    });

    test('should NOT allow transition from EXPIRED to CONFIRMED', () => {
      expect(
        BookingStateMachine.canTransition(BookingStatus.EXPIRED, BookingStatus.CONFIRMED)
      ).toBe(false);
    });
  });

  describe('validateTransition', () => {
    test('should pass without error for valid transitions', () => {
      expect(() => {
        BookingStateMachine.validateTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED);
      }).not.toThrow();
    });

    test('should throw error with code INVALID_STATUS_TRANSITION for invalid transition', () => {
      expect(() => {
        BookingStateMachine.validateTransition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED);
      }).toThrow(/Invalid booking status transition/);
    });
  });
});
