import { query } from '../config/db.js';

export const paymentRepository = {
  async createPayment({ bookingId, amount, status, transactionRef = null }) {
    const res = await query(
      `INSERT INTO payments (booking_id, amount, status, transaction_ref)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bookingId, amount, status, transactionRef]
    );
    return res.rows[0];
  },

  async findByBookingId(bookingId) {
    const res = await query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC`,
      [bookingId]
    );
    return res.rows;
  },

  async findLatestByBookingId(bookingId) {
    const res = await query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [bookingId]
    );
    return res.rows[0] || null;
  },

  async updateStatus(id, status) {
    const res = await query(
      `UPDATE payments
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return res.rows[0] || null;
  },
};
