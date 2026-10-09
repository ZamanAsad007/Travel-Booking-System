import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
  jwtSecret:
    process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.AUTH_DB_NAME || 'auth_db',
  },
};
