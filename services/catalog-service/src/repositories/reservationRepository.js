import { query } from '../config/db.js';

export const reservationRepository = {
  async getReservedCount(itemType, itemId) {
    const res = await query(
      `SELECT COALESCE(SUM(quantity), 0)::INT AS total
       FROM reservations
       WHERE item_type = $1 AND item_id = $2 AND status = 'CONFIRMED'`,
      [itemType, itemId]
    );
    return res.rows[0].total;
  },

  async createReservation({
    itemType,
    itemId,
    bookingId,
    quantity = 1,
    dateFrom = null,
    dateTo = null,
    status = 'CONFIRMED',
  }) {
    const res = await query(
      `INSERT INTO reservations (item_type, item_id, booking_id, quantity, date_from, date_to, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [itemType, itemId, bookingId, quantity, dateFrom, dateTo, status]
    );
    return res.rows[0];
  },

  async releaseReservation(bookingId) {
    const res = await query(
      `UPDATE reservations
       SET status = 'CANCELLED'
       WHERE booking_id = $1
       RETURNING *`,
      [bookingId]
    );
    return res.rows;
  },
};
