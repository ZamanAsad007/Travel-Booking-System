import { pool, query } from '../config/db.js';

export const bookingRepository = {
  async createBooking({
    userId,
    totalAmount,
    status = 'PENDING',
    items,
    travelers = [],
    couponCode = null,
    discountAmount = 0,
    couponId = null,
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Atomic coupon lock and validation within transaction
      if (couponId) {
        const couponRes = await client.query(`SELECT * FROM coupons WHERE id = $1 FOR UPDATE`, [
          couponId,
        ]);
        const coupon = couponRes.rows[0];
        if (!coupon || !coupon.active) {
          throw new Error('Coupon is no longer available');
        }
        if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
          throw new Error('Coupon usage limit reached');
        }

        const existingRedemption = await client.query(
          `SELECT id FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2 AND status = 'APPLIED' LIMIT 1`,
          [couponId, userId]
        );
        if (existingRedemption.rows.length > 0) {
          throw new Error('Coupon already redeemed by user');
        }

        await client.query(
          `UPDATE coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1`,
          [couponId]
        );
      }

      const bookingRes = await client.query(
        `INSERT INTO bookings (user_id, status, total_amount, coupon_code, discount_amount)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, status, totalAmount, couponCode || null, discountAmount || 0]
      );
      const booking = bookingRes.rows[0];

      if (couponId) {
        await client.query(
          `INSERT INTO coupon_redemptions (coupon_id, booking_id, user_id, discount_amount, status)
           VALUES ($1, $2, $3, $4, 'APPLIED')`,
          [couponId, booking.id, userId, discountAmount || 0]
        );
      }

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

      const createdTravelers = [];
      if (travelers && travelers.length > 0) {
        for (const t of travelers) {
          const travRes = await client.query(
            `INSERT INTO travelers (booking_id, full_name, passport_no, date_of_birth, seat_no)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [booking.id, t.full_name, t.passport_no, t.date_of_birth, t.seat_no || null]
          );
          createdTravelers.push(travRes.rows[0]);
        }
      }

      await client.query('COMMIT');
      return {
        ...booking,
        items: createdItems,
        travelers: createdTravelers,
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
    const [itemsRes, travRes] = await Promise.all([
      query(
        `SELECT * FROM booking_items WHERE booking_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
        [bookingIds]
      ),
      query(`SELECT * FROM travelers WHERE booking_id = ANY($1::uuid[]) ORDER BY created_at ASC`, [
        bookingIds,
      ]).catch(() => ({ rows: [] })),
    ]);

    const itemsByBookingId = {};
    for (const item of itemsRes.rows) {
      if (!itemsByBookingId[item.booking_id]) {
        itemsByBookingId[item.booking_id] = [];
      }
      itemsByBookingId[item.booking_id].push(item);
    }

    const travelersByBookingId = {};
    for (const trav of travRes.rows) {
      if (!travelersByBookingId[trav.booking_id]) {
        travelersByBookingId[trav.booking_id] = [];
      }
      travelersByBookingId[trav.booking_id].push(trav);
    }

    return bookings.map((b) => ({
      ...b,
      items: itemsByBookingId[b.id] || [],
      travelers: travelersByBookingId[b.id] || [],
    }));
  },

  async findById(id) {
    const bookingRes = await query(`SELECT * FROM bookings WHERE id = $1 LIMIT 1`, [id]);
    const booking = bookingRes.rows[0];
    if (!booking) return null;

    const [itemsRes, travRes] = await Promise.all([
      query(`SELECT * FROM booking_items WHERE booking_id = $1 ORDER BY created_at ASC`, [id]),
      query(`SELECT * FROM travelers WHERE booking_id = $1 ORDER BY created_at ASC`, [id]).catch(
        () => ({ rows: [] })
      ),
    ]);

    return {
      ...booking,
      items: itemsRes.rows,
      travelers: travRes.rows,
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

  async updateTicketNumber(id, ticketNumber) {
    const res = await query(
      `UPDATE bookings
       SET ticket_number = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [ticketNumber, id]
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
