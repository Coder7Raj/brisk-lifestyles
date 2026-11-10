ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'mobile-banking', 'sslcommerz'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id text UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_session_key text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_val_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS risk_level integer;
