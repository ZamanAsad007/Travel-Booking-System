-- Initialize isolated databases for each microservice
SELECT 'CREATE DATABASE auth_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

SELECT 'CREATE DATABASE catalog_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'catalog_db')\gexec

SELECT 'CREATE DATABASE booking_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'booking_db')\gexec

SELECT 'CREATE DATABASE payment_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_db')\gexec

SELECT 'CREATE DATABASE notification_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notification_db')\gexec
