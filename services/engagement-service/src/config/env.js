import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.ENGAGEMENT_SERVICE_PORT || '3006', 10),
  jwtSecret: process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production',
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.ENGAGEMENT_DB_NAME || 'engagement_db',
  },
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  nodeEnv: process.env.NODE_ENV || 'development',
};
