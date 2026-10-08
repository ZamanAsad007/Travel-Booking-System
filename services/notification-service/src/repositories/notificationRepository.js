import { pool } from '../config/db.js';

export const notificationRepository = {
  async create({
    userId = null,
    bookingId = null,
    type,
    recipientEmail,
    subject,
    content,
    payload = null,
    status = 'SENT',
    errorMessage = null,
  }) {
    const query = `
      INSERT INTO notifications (
        user_id, booking_id, type, recipient_email, subject, content, payload, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      userId,
      bookingId,
      type,
      recipientEmail,
      subject,
      content,
      payload ? JSON.stringify(payload) : null,
      status,
      errorMessage,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findAll({ userId, bookingId, limit = 50, offset = 0 } = {}) {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const values = [];

    if (userId) {
      values.push(userId);
      query += ` AND user_id = $${values.length}`;
    }

    if (bookingId) {
      values.push(bookingId);
      query += ` AND booking_id = $${values.length}`;
    }

    query += ' ORDER BY created_at DESC';

    values.push(limit);
    query += ` LIMIT $${values.length}`;

    values.push(offset);
    query += ` OFFSET $${values.length}`;

    const result = await pool.query(query, values);
    return result.rows;
  },

  async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },
};
