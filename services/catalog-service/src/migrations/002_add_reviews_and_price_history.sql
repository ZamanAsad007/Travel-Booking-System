-- Add avg_rating and review_count to flights
ALTER TABLE flights ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3, 2) DEFAULT 0;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- Add avg_rating and review_count to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3, 2) DEFAULT 4.5;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- Price history table for tracking price changes
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type VARCHAR(20) NOT NULL, -- 'flight', 'hotel', 'room'
  item_id UUID NOT NULL,
  old_price NUMERIC(10, 2) NOT NULL,
  new_price NUMERIC(10, 2) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history(item_type, item_id);
