-- Regalium migration: Neon PostgreSQL schema
-- Run this once in the Neon SQL Editor before enabling purchase verification.

CREATE TABLE IF NOT EXISTS rglm_purchases (
  tx_hash TEXT PRIMARY KEY CHECK (tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  wallet_address VARCHAR(42) NOT NULL CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  value_wei NUMERIC(78, 0) NOT NULL CHECK (value_wei >= 0),
  rglm_amount_raw NUMERIC(78, 0) NOT NULL CHECK (rglm_amount_raw > 0),
  block_number BIGINT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rglm_purchases_wallet_verified_idx
  ON rglm_purchases (wallet_address, verified_at DESC);

COMMENT ON TABLE rglm_purchases IS
  'Only stores purchases whose Polygon Amoy transaction receipt and RGLM Transfer event were verified by the Regalium API.';
