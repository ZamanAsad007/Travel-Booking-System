import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3004', 10),
  jwtSecret:
    process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  paymentSuccessRate: parseFloat(process.env.PAYMENT_SUCCESS_RATE || '0.9'), // 90% success by default
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.PAYMENT_DB_NAME || 'payment_db',
  },
};
