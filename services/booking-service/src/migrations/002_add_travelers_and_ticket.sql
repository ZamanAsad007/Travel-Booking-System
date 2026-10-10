CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_number ON bookings(ticket_number);

CREATE TABLE IF NOT EXISTS travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  passport_no VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  seat_no VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_travelers_booking ON travelers(booking_id);
