CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number VARCHAR(50) NOT NULL UNIQUE,
  airline VARCHAR(100) NOT NULL,
  origin VARCHAR(10) NOT NULL,
  destination VARCHAR(10) NOT NULL,
  departs_at TIMESTAMPTZ NOT NULL,
  arrives_at TIMESTAMPTZ NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  seats_total INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flights_route ON flights(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flights_departs ON flights(departs_at);

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  rating NUMERIC(2, 1) NOT NULL DEFAULT 4.5,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(LOWER(city));

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  price_per_night NUMERIC(10, 2) NOT NULL,
  rooms_total INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);

-- Reservations table (records confirmed reservations)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type VARCHAR(50) NOT NULL, -- 'flight' or 'hotel'
  item_id UUID NOT NULL,          -- flight_id or room_id
  booking_id UUID NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_item ON reservations(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_booking ON reservations(booking_id);

-- Idempotency table for event consumers
CREATE TABLE IF NOT EXISTS processed_events (
  event_id VARCHAR(255) PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
