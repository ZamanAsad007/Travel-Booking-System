import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.CATALOG_SERVICE_PORT || '3002', 10),
  jwtSecret:
    process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.CATALOG_DB_NAME || 'catalog_db',
  },
};
