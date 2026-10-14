-- Add free_cancellation column to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS free_cancellation BOOLEAN DEFAULT true;

-- Indexes for fast filtering and sorting
CREATE INDEX IF NOT EXISTS idx_flights_price ON flights(price);
CREATE INDEX IF NOT EXISTS idx_flights_avg_rating ON flights(avg_rating);
CREATE INDEX IF NOT EXISTS idx_flights_airline_lower ON flights(LOWER(airline));
CREATE INDEX IF NOT EXISTS idx_flights_origin_lower ON flights(LOWER(origin));
CREATE INDEX IF NOT EXISTS idx_flights_dest_lower ON flights(LOWER(destination));

CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotels(rating);
CREATE INDEX IF NOT EXISTS idx_hotels_free_cancellation ON hotels(free_cancellation);
CREATE INDEX IF NOT EXISTS idx_hotels_name_lower ON hotels(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_rooms_price ON rooms(price_per_night);
