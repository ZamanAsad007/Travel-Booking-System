import { query } from '../config/db.js';

export const refreshTokenRepository = {
  async create({ userId, tokenHash, expiresAt }) {
    const sql = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at
    `;
    const res = await query(sql, [userId, tokenHash, expiresAt]);
    return res.rows[0];
  },

  async findByTokenHash(tokenHash) {
    const sql = `
      SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
      FROM refresh_tokens
      WHERE token_hash = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(sql, [tokenHash]);
    return res.rows[0] || null;
  },

  async revoke(id) {
    const sql = `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
      RETURNING id, revoked_at
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async revokeAllForUser(userId) {
    const sql = `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL
      RETURNING id
    `;
    const res = await query(sql, [userId]);
    return res.rowCount;
  },
};
