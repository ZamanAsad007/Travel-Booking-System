import { pool, query } from '../config/db.js';

export const bookingRepository = {
  async createBooking({ userId, totalAmount, status = 'PENDING', items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bookingRes = await client.query(
        `INSERT INTO bookings (user_id, status, total_amount)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, status, totalAmount]
      );
      const booking = bookingRes.rows[0];

      const createdItems = [];
      for (const item of items) {
        const itemRes = await client.query(
          `INSERT INTO booking_items (booking_id, item_type, item_id, quantity, unit_price, date_from, date_to)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            booking.id,
            item.itemType,
            item.itemId,
            item.quantity,
            item.unitPrice,
            item.dateFrom || null,
            item.dateTo || null,
          ]
        );
        createdItems.push(itemRes.rows[0]);
      }

      await client.query('COMMIT');
      return {
        ...booking,
        items: createdItems,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findByUserId(userId) {
    const bookingsRes = await query(
      `SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const bookings = bookingsRes.rows;

    if (bookings.length === 0) return [];

    const bookingIds = bookings.map((b) => b.id);
    const itemsRes = await query(
      `SELECT * FROM booking_items WHERE booking_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [bookingIds]
    );

    const itemsByBookingId = {};
    for (const item of itemsRes.rows) {
      if (!itemsByBookingId[item.booking_id]) {
        itemsByBookingId[item.booking_id] = [];
      }
      itemsByBookingId[item.booking_id].push(item);
    }

    return bookings.map((b) => ({
      ...b,
      items: itemsByBookingId[b.id] || [],
    }));
  },

  async findById(id) {
    const bookingRes = await query(
      `SELECT * FROM bookings WHERE id = $1 LIMIT 1`,
      [id]
    );
    const booking = bookingRes.rows[0];
    if (!booking) return null;

    const itemsRes = await query(
      `SELECT * FROM booking_items WHERE booking_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return {
      ...booking,
      items: itemsRes.rows,
    };
  },

  async updateStatus(id, newStatus) {
    const res = await query(
      `UPDATE bookings
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newStatus, id]
    );
    return res.rows[0] || null;
  },
};
