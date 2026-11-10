BEGIN;

DO $$
BEGIN
  IF to_regclass('products') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price_paisa'
  ) THEN
    ALTER TABLE products RENAME COLUMN price_paisa TO price_taka;
    ALTER TABLE products RENAME COLUMN compare_at_price_paisa TO compare_at_price_taka;
    ALTER TABLE products
      ALTER COLUMN price_taka TYPE numeric(12,2) USING price_taka::numeric / 100,
      ALTER COLUMN compare_at_price_taka TYPE numeric(12,2)
        USING compare_at_price_taka::numeric / 100;
  END IF;

  IF to_regclass('orders') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subtotal_paisa'
  ) THEN
    ALTER TABLE orders RENAME COLUMN subtotal_paisa TO subtotal_taka;
    ALTER TABLE orders
      ALTER COLUMN subtotal_taka TYPE numeric(14,2) USING subtotal_taka::numeric / 100;
  END IF;

  IF to_regclass('order_items') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'unit_price_paisa'
  ) THEN
    ALTER TABLE order_items RENAME COLUMN unit_price_paisa TO unit_price_taka;
    ALTER TABLE order_items
      ALTER COLUMN unit_price_taka TYPE numeric(12,2) USING unit_price_taka::numeric / 100;
  END IF;
END $$;

COMMIT;
