CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL, -- 'flight' or 'hotel'
  item_id VARCHAR(100) NOT NULL,  -- flight_id or hotel_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- Completed trips (populated from booking.confirmed event for verified reviews)
CREATE TABLE IF NOT EXISTS completed_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, booking_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_completed_trips_user ON completed_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_trips_item ON completed_trips(item_type, item_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name VARCHAR(100),
  booking_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, booking_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_item ON reviews(item_type, item_id);

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email VARCHAR(255),
  item_type VARCHAR(20) NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),
  target_price NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'TRIGGERED', 'CANCELLED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_price_alerts_item ON price_alerts(item_type, item_id, status);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);

-- Loyalty accounts & ledger
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  user_id UUID PRIMARY KEY,
  user_email VARCHAR(255),
  points_balance INT NOT NULL DEFAULT 0,
  lifetime_points INT NOT NULL DEFAULT 0,
  tier VARCHAR(20) NOT NULL DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES loyalty_accounts(user_id) ON DELETE CASCADE,
  booking_id UUID,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  balance_after INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user ON loyalty_ledger(user_id);

-- Idempotency table
CREATE TABLE IF NOT EXISTS processed_events (
  event_id VARCHAR(255) PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
