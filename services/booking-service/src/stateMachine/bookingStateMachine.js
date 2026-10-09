export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
};

const ALLOWED_TRANSITIONS = {
  [BookingStatus.PENDING]: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
    BookingStatus.EXPIRED,
  ],
  [BookingStatus.CONFIRMED]: [BookingStatus.CANCELLED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.EXPIRED]: [],
};

export class BookingStateMachine {
  static canTransition(fromStatus, toStatus) {
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  static validateTransition(fromStatus, toStatus) {
    if (!this.canTransition(fromStatus, toStatus)) {
      const err = new Error(
        `Invalid booking status transition: cannot change status from '${fromStatus}' to '${toStatus}'`
      );
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }
  }
}
