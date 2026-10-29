CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 2 AND 80),
  email text NOT NULL UNIQUE CHECK (length(email) <= 254),
  avatar_url text CHECK (avatar_url IS NULL OR length(avatar_url) <= 2048),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE identity.users
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE IF NOT EXISTS identity.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS identity_sessions_user_active_idx
  ON identity.sessions(user_id, expires_at) WHERE revoked_at IS NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES identity.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at DESC);
