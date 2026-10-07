import { query } from '../config/db.js';

export const hotelRepository = {
  async search({ city, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (city) {
      values.push(`%${city.toLowerCase().trim()}%`);
      conditions.push(`LOWER(h.city) LIKE $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM hotels h ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT 
        h.id,
        h.name,
        h.city,
        h.address,
        h.rating,
        h.image_url,
        MIN(r.price_per_night) AS starting_price,
        COUNT(r.id)::INT AS room_types_count
      FROM hotels h
      LEFT JOIN rooms r ON h.id = r.hotel_id
      ${whereClause}
      GROUP BY h.id
      ORDER BY h.rating DESC, h.name ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hotels: dataRes.rows,
    };
  },

  async findById(id) {
    const hotelSql = `
      SELECT id, name, city, address, rating, image_url, created_at
      FROM hotels
      WHERE id = $1
      LIMIT 1
    `;
    const hotelRes = await query(hotelSql, [id]);
    const hotel = hotelRes.rows[0];

    if (!hotel) return null;

    const roomsSql = `
      SELECT 
        r.id,
        r.hotel_id,
        r.type,
        r.price_per_night,
        r.rooms_total,
        r.rooms_total - COALESCE((
          SELECT SUM(res.quantity)
          FROM reservations res
          WHERE res.item_type = 'hotel'
            AND res.item_id = r.id
            AND res.status = 'CONFIRMED'
        ), 0)::INT AS rooms_available
      FROM rooms r
      WHERE r.hotel_id = $1
      ORDER BY r.price_per_night ASC
    `;
    const roomsRes = await query(roomsSql, [id]);

    return {
      ...hotel,
      rooms: roomsRes.rows,
    };
  },

  async findRoomById(roomId) {
    const sql = `
      SELECT 
        r.id,
        r.hotel_id,
        r.type,
        r.price_per_night,
        r.rooms_total,
        h.name AS hotel_name,
        h.city AS hotel_city,
        r.rooms_total - COALESCE((
          SELECT SUM(res.quantity)
          FROM reservations res
          WHERE res.item_type = 'hotel'
            AND res.item_id = r.id
            AND res.status = 'CONFIRMED'
        ), 0)::INT AS rooms_available
      FROM rooms r
      JOIN hotels h ON r.hotel_id = h.id
      WHERE r.id = $1
      LIMIT 1
    `;
    const res = await query(sql, [roomId]);
    return res.rows[0] || null;
  },
};
