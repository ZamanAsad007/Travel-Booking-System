import { query } from '../config/db.js';

export const wishlistRepository = {
  async findByUser(userId) {
    const sql = `
      SELECT id, user_id, item_type, item_id, created_at
      FROM wishlist
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const res = await query(sql, [userId]);
    return res.rows;
  },

  async isWishlisted(userId, itemType, itemId) {
    const sql = `
      SELECT id FROM wishlist
      WHERE user_id = $1 AND LOWER(item_type) = LOWER($2) AND item_id = $3
      LIMIT 1
    `;
    const res = await query(sql, [userId, itemType, itemId]);
    return res.rows.length > 0;
  },

  async add({ userId, itemType, itemId }) {
    const sql = `
      INSERT INTO wishlist (user_id, item_type, item_id)
      VALUES ($1, LOWER($2), $3)
      ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET created_at = NOW()
      RETURNING id, user_id, item_type, item_id, created_at
    `;
    const res = await query(sql, [userId, itemType, itemId]);
    return res.rows[0];
  },

  async remove({ userId, itemType, itemId }) {
    const sql = `
      DELETE FROM wishlist
      WHERE user_id = $1 AND LOWER(item_type) = LOWER($2) AND item_id = $3
      RETURNING id
    `;
    const res = await query(sql, [userId, itemType, itemId]);
    return res.rowCount > 0;
  },

  async removeById(userId, wishlistId) {
    const sql = `
      DELETE FROM wishlist
      WHERE user_id = $1 AND id = $2
      RETURNING id
    `;
    const res = await query(sql, [userId, wishlistId]);
    return res.rowCount > 0;
  },
};
