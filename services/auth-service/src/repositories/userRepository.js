import { query } from '../config/db.js';

export const userRepository = {
  async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create({ name, email, passwordHash, role = 'user' }) {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role]
    );
    return res.rows[0];
  },
};
