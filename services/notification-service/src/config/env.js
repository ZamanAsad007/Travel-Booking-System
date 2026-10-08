import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3005', 10),
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.NOTIFICATION_DB_NAME || 'notification_db',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  },
  smtp: {
    host: process.env.SMTP_HOST || process.env.MAILPIT_SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || process.env.MAILPIT_SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Travel Booking <noreply@travelbooking.local>',
  },
};
