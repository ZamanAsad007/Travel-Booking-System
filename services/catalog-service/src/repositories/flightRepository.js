import { query } from '../config/db.js';

export const flightRepository = {
  async search({
    from,
    to,
    date,
    minPrice,
    maxPrice,
    airline,
    minRating,
    maxDuration,
    sortBy = 'departs_at_asc',
    page = 1,
    limit = 10,
  }) {
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

    if (minPrice !== undefined && minPrice !== '' && !isNaN(parseFloat(minPrice))) {
      values.push(parseFloat(minPrice));
      conditions.push(`price >= $${values.length}`);
    }

    if (maxPrice !== undefined && maxPrice !== '' && !isNaN(parseFloat(maxPrice))) {
      values.push(parseFloat(maxPrice));
      conditions.push(`price <= $${values.length}`);
    }

    if (airline && airline.trim()) {
      values.push(`%${airline.toLowerCase().trim()}%`);
      conditions.push(`LOWER(airline) LIKE $${values.length}`);
    }

    if (minRating !== undefined && minRating !== '' && !isNaN(parseFloat(minRating))) {
      values.push(parseFloat(minRating));
      conditions.push(`COALESCE(avg_rating, 0) >= $${values.length}`);
    }

    if (maxDuration !== undefined && maxDuration !== '' && !isNaN(parseFloat(maxDuration))) {
      values.push(parseFloat(maxDuration));
      conditions.push(
        `(EXTRACT(EPOCH FROM (arrives_at - departs_at)) / 3600) <= $${values.length}`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM flights ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    let orderByClause = 'ORDER BY f.departs_at ASC';
    if (sortBy === 'price_asc') {
      orderByClause = 'ORDER BY f.price ASC, f.departs_at ASC';
    } else if (sortBy === 'price_desc') {
      orderByClause = 'ORDER BY f.price DESC, f.departs_at ASC';
    } else if (sortBy === 'duration_asc') {
      orderByClause = 'ORDER BY (f.arrives_at - f.departs_at) ASC, f.price ASC';
    } else if (sortBy === 'rating_desc') {
      orderByClause = 'ORDER BY COALESCE(f.avg_rating, 0) DESC, f.price ASC';
    }

    const dataSql = `
      SELECT 
        f.id,
        f.flight_number,
        f.airline,
        f.origin,
        f.destination,
        f.departs_at,
        f.arrives_at,
        ROUND(EXTRACT(EPOCH FROM (f.arrives_at - f.departs_at)) / 60)::INT AS duration_minutes,
        f.price,
        f.seats_total,
        COALESCE(f.avg_rating, 0)::FLOAT AS avg_rating,
        COALESCE(f.review_count, 0)::INT AS review_count,
        f.seats_total - COALESCE((
          SELECT SUM(r.quantity) 
          FROM reservations r 
          WHERE r.item_type = 'flight' 
            AND r.item_id = f.id 
            AND r.status = 'CONFIRMED'
        ), 0)::INT AS seats_available
      FROM flights f
      ${whereClause}
      ${orderByClause}
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
        COALESCE(f.avg_rating, 0)::FLOAT AS avg_rating,
        COALESCE(f.review_count, 0)::INT AS review_count,
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

  async updateRating(flightId, newRating) {
    const sql = `
      UPDATE flights
      SET 
        avg_rating = ROUND(((COALESCE(avg_rating, 0) * COALESCE(review_count, 0)) + $2) / (COALESCE(review_count, 0) + 1), 2),
        review_count = COALESCE(review_count, 0) + 1
      WHERE id = $1
      RETURNING id, avg_rating, review_count
    `;
    const res = await query(sql, [flightId, newRating]);
    return res.rows[0] || null;
  },

  async getDistinctAirlines() {
    const res = await query('SELECT DISTINCT airline FROM flights ORDER BY airline ASC');
    return res.rows.map((r) => r.airline);
  },

  async suggestAirportsAndAirlines(q = '') {
    const term = `%${q.toLowerCase().trim()}%`;
    const sql = `
      SELECT DISTINCT origin AS code, 'airport' AS type FROM flights WHERE LOWER(origin) LIKE $1
      UNION
      SELECT DISTINCT destination AS code, 'airport' AS type FROM flights WHERE LOWER(destination) LIKE $1
      UNION
      SELECT DISTINCT airline AS code, 'airline' AS type FROM flights WHERE LOWER(airline) LIKE $1
      LIMIT 10
    `;
    const res = await query(sql, [term]);
    return res.rows;
  },
};
