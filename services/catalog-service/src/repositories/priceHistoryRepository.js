import { query } from '../config/db.js';

export const priceHistoryRepository = {
  async recordChange({ itemType, itemId, oldPrice, newPrice }) {
    const sql = `
      INSERT INTO price_history (item_type, item_id, old_price, new_price)
      VALUES (LOWER($1), $2, $3, $4)
      RETURNING id, item_type, item_id, old_price, new_price, changed_at
    `;
    const res = await query(sql, [itemType, itemId, oldPrice, newPrice]);
    return res.rows[0];
  },

  async getHistory({ itemType, itemId, limit = 30 }) {
    const sql = `
      SELECT id, item_type, item_id, old_price, new_price, changed_at
      FROM price_history
      WHERE LOWER(item_type) = LOWER($1) AND item_id = $2
      ORDER BY changed_at ASC
      LIMIT $3
    `;
    const res = await query(sql, [itemType, itemId, limit]);
    return res.rows;
  },
};
