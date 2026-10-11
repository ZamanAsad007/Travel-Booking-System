import { pool, query } from '../config/db.js';

export function computeTier(lifetimePoints = 0) {
  if (lifetimePoints >= 2000) return 'GOLD';
  if (lifetimePoints >= 500) return 'SILVER';
  return 'BRONZE';
}

export function getTierDetails(tier, lifetimePoints = 0) {
  const currentTier = tier || computeTier(lifetimePoints);
  if (currentTier === 'GOLD') {
    return {
      currentTier: 'GOLD',
      nextTier: null,
      pointsToNextTier: 0,
      progressPercentage: 100,
    };
  }
  if (currentTier === 'SILVER') {
    const pointsInTier = Math.max(0, lifetimePoints - 500);
    const progressPercentage = Math.min(100, Math.floor((pointsInTier / 1500) * 100));
    return {
      currentTier: 'SILVER',
      nextTier: 'GOLD',
      pointsToNextTier: Math.max(0, 2000 - lifetimePoints),
      progressPercentage,
    };
  }
  // BRONZE
  const progressPercentage = Math.min(100, Math.floor((Math.max(0, lifetimePoints) / 500) * 100));
  return {
    currentTier: 'BRONZE',
    nextTier: 'SILVER',
    pointsToNextTier: Math.max(0, 500 - lifetimePoints),
    progressPercentage,
  };
}

export const loyaltyRepository = {
  computeTier,
  getTierDetails,

  async getAccount(userId) {
    const sql = `
      SELECT user_id, user_email, points_balance, lifetime_points, tier, created_at, updated_at
      FROM loyalty_accounts
      WHERE user_id = $1
    `;
    const res = await query(sql, [userId]);
    return res.rows[0] || null;
  },

  async createAccount({ userId, email, initialPoints = 0 }) {
    const tier = computeTier(initialPoints);
    const sql = `
      INSERT INTO loyalty_accounts (user_id, user_email, points_balance, lifetime_points, tier)
      VALUES ($1, $2, $3, $3, $4)
      ON CONFLICT (user_id) DO UPDATE
      SET user_email = COALESCE(EXCLUDED.user_email, loyalty_accounts.user_email)
      RETURNING user_id, user_email, points_balance, lifetime_points, tier, created_at, updated_at
    `;
    const res = await query(sql, [userId, email, initialPoints, tier]);
    const account = res.rows[0];

    if (initialPoints > 0) {
      await query(
        `INSERT INTO loyalty_ledger (user_id, points, reason, balance_after)
         VALUES ($1, $2, $3, $4)`,
        [userId, initialPoints, 'Welcome Bonus', initialPoints]
      );
    }

    return account;
  },

  async getLedger(userId, limit = 50) {
    const sql = `
      SELECT id, user_id, booking_id, points, reason, balance_after, created_at
      FROM loyalty_ledger
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const res = await query(sql, [userId, limit]);
    return res.rows;
  },

  async addLedgerEntry({ userId, bookingId = null, points, reason }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accRes = await client.query(
        'SELECT * FROM loyalty_accounts WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      let account = accRes.rows[0];
      if (!account) {
        const initRes = await client.query(
          `INSERT INTO loyalty_accounts (user_id, points_balance, lifetime_points, tier)
           VALUES ($1, 0, 0, 'BRONZE')
           RETURNING *`,
          [userId]
        );
        account = initRes.rows[0];
      }

      const currentBalance = parseInt(account.points_balance, 10) || 0;
      const currentLifetime = parseInt(account.lifetime_points, 10) || 0;

      const newBalance = Math.max(0, currentBalance + points);
      const newLifetime = points > 0 ? (currentLifetime + points) : currentLifetime;
      const newTier = computeTier(newLifetime);

      const updateRes = await client.query(
        `UPDATE loyalty_accounts
         SET points_balance = $1, lifetime_points = $2, tier = $3, updated_at = NOW()
         WHERE user_id = $4
         RETURNING user_id, user_email, points_balance, lifetime_points, tier, created_at, updated_at`,
        [newBalance, newLifetime, newTier, userId]
      );
      const updatedAccount = updateRes.rows[0];

      const ledgerRes = await client.query(
        `INSERT INTO loyalty_ledger (user_id, booking_id, points, reason, balance_after)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, booking_id, points, reason, balance_after, created_at`,
        [userId, bookingId, points, reason, newBalance]
      );
      const ledgerEntry = ledgerRes.rows[0];

      await client.query('COMMIT');
      return { account: updatedAccount, ledgerEntry };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async hasBookingPoints(bookingId) {
    const sql = `
      SELECT id, points
      FROM loyalty_ledger
      WHERE booking_id = $1 AND points > 0
      LIMIT 1
    `;
    const res = await query(sql, [bookingId]);
    return res.rows[0] || null;
  },
};
