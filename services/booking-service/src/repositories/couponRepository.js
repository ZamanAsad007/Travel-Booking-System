import { query, pool } from '../config/db.js';

export const couponRepository = {
  async findByCode(code, client = null) {
    const q = client ? client.query.bind(client) : query;
    const res = await q(`SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) LIMIT 1`, [code]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await query(`SELECT * FROM coupons WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  },

  async findUserRedemption(couponId, userId, client = null) {
    const q = client ? client.query.bind(client) : query;
    const res = await q(
      `SELECT * FROM coupon_redemptions 
       WHERE coupon_id = $1 AND user_id = $2 AND status = 'APPLIED' 
       LIMIT 1`,
      [couponId, userId]
    );
    return res.rows[0] || null;
  },

  async findAll({ page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) FROM coupons`);
    const total = parseInt(countRes.rows[0].count, 10);

    const rowsRes = await query(
      `SELECT * FROM coupons ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      coupons: rowsRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async create({
    code,
    discount_type,
    discount_value,
    min_amount = 0,
    max_uses = null,
    valid_from = null,
    valid_to = null,
    active = true,
  }) {
    const res = await query(
      `INSERT INTO coupons (
         code, discount_type, discount_value, min_amount, max_uses, valid_from, valid_to, active
       )
       VALUES (UPPER($1), $2, $3, $4, $5, COALESCE($6, NOW()), $7, $8)
       RETURNING *`,
      [code, discount_type, discount_value, min_amount, max_uses, valid_from, valid_to, active]
    );
    return res.rows[0];
  },

  async update(id, fields) {
    const allowed = [
      'code',
      'discount_type',
      'discount_value',
      'min_amount',
      'max_uses',
      'valid_from',
      'valid_to',
      'active',
    ];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        values.push(key === 'code' ? fields[key].toUpperCase() : fields[key]);
        updates.push(`${key} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `UPDATE coupons SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await query(`DELETE FROM coupons WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0] || null;
  },

  async releaseByBookingId(bookingId, client = null) {
    const q = client ? client.query.bind(client) : query;
    const redemptionsRes = await q(
      `UPDATE coupon_redemptions
       SET status = 'RELEASED', updated_at = NOW()
       WHERE booking_id = $1 AND status = 'APPLIED'
       RETURNING coupon_id`,
      [bookingId]
    );

    for (const row of redemptionsRes.rows) {
      await q(
        `UPDATE coupons
         SET used_count = GREATEST(0, used_count - 1), updated_at = NOW()
         WHERE id = $1`,
        [row.coupon_id]
      );
    }

    return redemptionsRes.rows;
  },
};
