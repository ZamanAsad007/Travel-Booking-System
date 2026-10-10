import { query } from '../config/db.js';

export const userRepository = {
  async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [
      email.toLowerCase().trim(),
    ]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create({ name, email, passwordHash, role = 'USER' }) {
    const normalizedRole = (role || 'USER').toUpperCase();
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, normalizedRole]
    );
    return res.rows[0];
  },

  async seedAdminUser(bcrypt) {
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@travel.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_SEED_NAME || 'System Administrator';

    const existing = await this.findByEmail(adminEmail);
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      const admin = await this.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      });
      console.log(`[auth-service] Seeded admin user: ${adminEmail}`);
      return admin;
    }
    return existing;
  },
};
