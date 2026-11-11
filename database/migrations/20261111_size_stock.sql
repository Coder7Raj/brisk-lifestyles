ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_by_size jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE products
SET stock_by_size = COALESCE(
  (SELECT jsonb_object_agg(size, 10)
   FROM unnest(products.sizes) AS sizes(size)),
  '{}'::jsonb
)
WHERE stock_by_size = '{}'::jsonb AND cardinality(sizes) > 0;
