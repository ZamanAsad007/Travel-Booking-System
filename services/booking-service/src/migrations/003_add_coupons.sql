-- Migration: 003_add_coupons.sql
-- Description: Create coupons and coupon_redemptions tables, add coupon columns to bookings

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENT', 'FLAT')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_amount NUMERIC(10, 2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_to TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'RELEASED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id, coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_booking ON coupon_redemptions(booking_id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

-- Seed default coupons if not already present
INSERT INTO coupons (code, discount_type, discount_value, min_amount, max_uses, active)
VALUES 
  ('SAVE10', 'PERCENT', 10.00, 50.00, 1000, true),
  ('FLAT50', 'FLAT', 50.00, 200.00, 500, true),
  ('SUMMER20', 'PERCENT', 20.00, 100.00, 200, true)
ON CONFLICT (code) DO NOTHING;
