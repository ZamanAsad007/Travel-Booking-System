import { pool, query } from '../config/db.js';

export const outboxRepository = {
  async insertOutbox(clientOrPool, eventType, payload) {
    const executor = clientOrPool || pool;
    const sql = `
      INSERT INTO outbox (event_type, payload)
      VALUES ($1, $2)
      RETURNING id, event_type, payload, created_at, published_at
    `;
    const res = await executor.query(sql, [eventType, JSON.stringify(payload)]);
    return res.rows[0];
  },

  async getUnpublished(limit = 50) {
    const sql = `
      SELECT id, event_type, payload, created_at
      FROM outbox
      WHERE published_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const res = await query(sql, [limit]);
    return res.rows.map((row) => ({
      ...row,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    }));
  },

  async markPublished(id) {
    const sql = `
      UPDATE outbox
      SET published_at = NOW()
      WHERE id = $1
      RETURNING id, published_at
    `;
    const res = await query(sql, [id]);
    return res.rows[0];
  },
};
