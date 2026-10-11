import { query } from '../config/db.js';

export const reviewRepository = {
  async findByItem({ itemType, itemId, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const statsSql = `
      SELECT 
        COUNT(*)::INT AS total_reviews,
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::FLOAT AS avg_rating
      FROM reviews
      WHERE LOWER(item_type) = LOWER($1) AND item_id = $2
    `;
    const statsRes = await query(statsSql, [itemType, itemId]);
    const { total_reviews: total, avg_rating: avgRating } = statsRes.rows[0];

    const dataSql = `
      SELECT id, user_id, user_name, booking_id, item_type, item_id, rating, comment, created_at
      FROM reviews
      WHERE LOWER(item_type) = LOWER($1) AND item_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const dataRes = await query(dataSql, [itemType, itemId, limit, offset]);

    return {
      total,
      avgRating,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      reviews: dataRes.rows,
    };
  },

  async hasCompletedTrip(userId, bookingId, itemType, itemId) {
    const sql = `
      SELECT id FROM completed_trips
      WHERE user_id = $1 
        AND booking_id = $2 
        AND LOWER(item_type) = LOWER($3) 
        AND item_id = $4
      LIMIT 1
    `;
    const res = await query(sql, [userId, bookingId, itemType, itemId]);
    return res.rows.length > 0;
  },

  async hasReviewed(userId, bookingId, itemId) {
    const sql = `
      SELECT id FROM reviews
      WHERE user_id = $1 AND booking_id = $2 AND item_id = $3
      LIMIT 1
    `;
    const res = await query(sql, [userId, bookingId, itemId]);
    return res.rows.length > 0;
  },

  async create({ userId, userName, bookingId, itemType, itemId, rating, comment }) {
    const sql = `
      INSERT INTO reviews (user_id, user_name, booking_id, item_type, item_id, rating, comment)
      VALUES ($1, $2, $3, LOWER($4), $5, $6, $7)
      RETURNING id, user_id, user_name, booking_id, item_type, item_id, rating, comment, created_at
    `;
    const res = await query(sql, [
      userId,
      userName || 'Traveler',
      bookingId,
      itemType,
      itemId,
      rating,
      comment || '',
    ]);
    return res.rows[0];
  },

  async findCompletedTrips(userId) {
    const sql = `
      SELECT ct.booking_id, ct.item_type, ct.item_id, ct.completed_at,
             EXISTS(
               SELECT 1 FROM reviews r 
               WHERE r.user_id = ct.user_id 
                 AND r.booking_id = ct.booking_id 
                 AND r.item_id = ct.item_id
             ) AS has_reviewed
      FROM completed_trips ct
      WHERE ct.user_id = $1
      ORDER BY ct.completed_at DESC
    `;
    const res = await query(sql, [userId]);
    return res.rows;
  },
};
