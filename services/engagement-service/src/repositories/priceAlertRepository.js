import { query } from '../config/db.js';

export const priceAlertRepository = {
  async findByUser(userId) {
    const sql = `
      SELECT id, user_id, user_email, item_type, item_id, item_name, target_price, status, created_at, triggered_at
      FROM price_alerts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const res = await query(sql, [userId]);
    return res.rows;
  },

  async create({ userId, userEmail, itemType, itemId, itemName, targetPrice }) {
    const sql = `
      INSERT INTO price_alerts (user_id, user_email, item_type, item_id, item_name, target_price, status)
      VALUES ($1, $2, LOWER($3), $4, $5, $6, 'ACTIVE')
      RETURNING id, user_id, user_email, item_type, item_id, item_name, target_price, status, created_at
    `;
    const res = await query(sql, [
      userId,
      userEmail,
      itemType,
      itemId,
      itemName || `${itemType.toUpperCase()} #${itemId}`,
      targetPrice,
    ]);
    return res.rows[0];
  },

  async delete(userId, alertId) {
    const sql = `
      DELETE FROM price_alerts
      WHERE user_id = $1 AND id = $2
      RETURNING id
    `;
    const res = await query(sql, [userId, alertId]);
    return res.rowCount > 0;
  },

  async findActiveAlertsForPriceDrop({ itemType, itemId, newPrice }) {
    const sql = `
      SELECT id, user_id, user_email, item_type, item_id, item_name, target_price
      FROM price_alerts
      WHERE LOWER(item_type) = LOWER($1)
        AND item_id = $2
        AND status = 'ACTIVE'
        AND target_price >= $3
    `;
    const res = await query(sql, [itemType, itemId, newPrice]);
    return res.rows;
  },

  async markTriggered(alertId) {
    const sql = `
      UPDATE price_alerts
      SET status = 'TRIGGERED', triggered_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(sql, [alertId]);
    return res.rows[0] || null;
  },
};
