import { query } from '../config/db.js';

export const flightRepository = {
  async search({ from, to, date, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (from) {
      values.push(from.toUpperCase().trim());
      conditions.push(`origin = $${values.length}`);
    }

    if (to) {
      values.push(to.toUpperCase().trim());
      conditions.push(`destination = $${values.length}`);
    }

    if (date) {
      values.push(date);
      conditions.push(`DATE(departs_at) = DATE($${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM flights ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT 
        f.id,
        f.flight_number,
        f.airline,
        f.origin,
        f.destination,
        f.departs_at,
        f.arrives_at,
        f.price,
        f.seats_total,
        f.seats_total - COALESCE((
          SELECT SUM(r.quantity) 
          FROM reservations r 
          WHERE r.item_type = 'flight' 
            AND r.item_id = f.id 
            AND r.status = 'CONFIRMED'
        ), 0)::INT AS seats_available
      FROM flights f
      ${whereClause}
      ORDER BY f.departs_at ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      flights: dataRes.rows,
    };
  },

  async findById(id) {
    const sql = `
      SELECT 
        f.id,
        f.flight_number,
        f.airline,
        f.origin,
        f.destination,
        f.departs_at,
        f.arrives_at,
        f.price,
        f.seats_total,
        f.seats_total - COALESCE((
          SELECT SUM(r.quantity) 
          FROM reservations r 
          WHERE r.item_type = 'flight' 
            AND r.item_id = f.id 
            AND r.status = 'CONFIRMED'
        ), 0)::INT AS seats_available
      FROM flights f
      WHERE f.id = $1
      LIMIT 1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },
};
