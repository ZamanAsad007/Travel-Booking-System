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

  async create({
    flight_number,
    airline,
    origin,
    destination,
    departs_at,
    arrives_at,
    price,
    seats_total,
  }) {
    const sql = `
      INSERT INTO flights (flight_number, airline, origin, destination, departs_at, arrives_at, price, seats_total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const res = await query(sql, [
      flight_number.trim(),
      airline.trim(),
      origin.toUpperCase().trim(),
      destination.toUpperCase().trim(),
      departs_at,
      arrives_at,
      price,
      seats_total,
    ]);
    return res.rows[0];
  },

  async update(id, fields) {
    const allowed = [
      'flight_number',
      'airline',
      'origin',
      'destination',
      'departs_at',
      'arrives_at',
      'price',
      'seats_total',
    ];
    const updates = [];
    const values = [id];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        values.push(fields[key]);
        updates.push(`${key} = $${values.length}`);
      }
    }

    if (updates.length === 0) return this.findById(id);

    const sql = `UPDATE flights SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await query('DELETE FROM flights WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },
};
