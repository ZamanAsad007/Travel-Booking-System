-- Migration 004: Create transactional outbox table for reliable event publishing
CREATE TABLE IF NOT EXISTS outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_unpublished ON outbox(created_at) WHERE published_at IS NULL;
