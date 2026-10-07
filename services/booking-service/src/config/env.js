import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.BOOKING_SERVICE_PORT || '3003', 10),
  jwtSecret: process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production',
  catalogServiceUrl: process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002',
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.BOOKING_DB_NAME || 'booking_db',
  },
};
