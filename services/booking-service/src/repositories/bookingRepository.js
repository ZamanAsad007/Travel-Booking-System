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
    const bookingRes = await query(`SELECT * FROM bookings WHERE id = $1 LIMIT 1`, [id]);
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

  async findAll({ page = 1, limit = 50, status } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (status) {
      values.push(status.toUpperCase().trim());
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM bookings ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const bookingsRes = await query(
      `SELECT * FROM bookings ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const bookings = bookingsRes.rows;
    if (bookings.length === 0) {
      return { total, page, limit, totalPages: Math.ceil(total / limit), bookings: [] };
    }

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

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      bookings: bookings.map((b) => ({
        ...b,
        items: itemsByBookingId[b.id] || [],
      })),
    };
  },

  async getStats() {
    const summaryRes = await query(`
      SELECT 
        COUNT(*)::INT AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED')::INT AS confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::INT AS cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'PENDING')::INT AS pending_bookings,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'CONFIRMED'), 0)::NUMERIC AS total_revenue
      FROM bookings
    `);

    const statusRes = await query(`
      SELECT status, COUNT(*)::INT as count
      FROM bookings
      GROUP BY status
      ORDER BY count DESC
    `);

    const timelineRes = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        COUNT(*)::INT AS count,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'CONFIRMED'), 0)::NUMERIC AS revenue
      FROM bookings
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `);

    const topItemsRes = await query(`
      SELECT 
        bi.item_id,
        bi.item_type,
        COUNT(bi.id)::INT AS booking_count,
        SUM(bi.quantity)::INT AS total_quantity,
        SUM(bi.unit_price * bi.quantity)::NUMERIC AS total_sales
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE b.status = 'CONFIRMED'
      GROUP BY bi.item_id, bi.item_type
      ORDER BY booking_count DESC
      LIMIT 10
    `);

    const summary = summaryRes.rows[0];
    return {
      totalBookings: summary.total_bookings,
      confirmedBookings: summary.confirmed_bookings,
      cancelledBookings: summary.cancelled_bookings,
      pendingBookings: summary.pending_bookings,
      totalRevenue: parseFloat(summary.total_revenue),
      bookingsByStatus: statusRes.rows,
      timeline: timelineRes.rows.map((t) => ({ ...t, revenue: parseFloat(t.revenue) })),
      topItems: topItemsRes.rows.map((t) => ({ ...t, total_sales: parseFloat(t.total_sales) })),
    };
  },
};
