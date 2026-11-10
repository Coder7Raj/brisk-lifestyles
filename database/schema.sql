CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL REFERENCES categories(slug),
  price_taka numeric(12,2) NOT NULL CHECK (price_taka >= 0),
  compare_at_price_taka numeric(12,2) CHECK (compare_at_price_taka >= price_taka),
  image_url text,
  sizes text[] NOT NULL DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_active_idx ON products(category, is_active);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (length(email) <= 254),
  subtotal_taka numeric(14,2) NOT NULL CHECK (subtotal_taka >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'fulfilled')),
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'mobile-banking')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod'
  CHECK (payment_method IN ('cod', 'mobile-banking'));

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  unit_price_taka numeric(12,2) NOT NULL CHECK (unit_price_taka >= 0),
  size text
);

INSERT INTO categories (slug, name, description, sort_order) VALUES
  ('punjabi', 'Punjabi', 'Everyday and occasion wear', 1),
  ('kurti', 'Kurti', 'Comfortable styles for women', 2),
  ('pajama', 'Pajama', 'Pair with your favorite punjabi', 3),
  ('fragrance', 'Fragrance', 'Perfume, eau de parfum and attar', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (slug, name, description, category, price_taka, compare_at_price_taka, sizes) VALUES
  ('festive-gold-punjabi', 'Festive Gold Punjabi', 'A festive favorite in soft cotton.', 'punjabi', 4250.00, 5100.00, ARRAY['S','M','L','XL']),
  ('everyday-indigo-punjabi', 'Everyday Indigo Punjabi', 'An easy everyday cotton style.', 'punjabi', 2450.00, 2940.00, ARRAY['S','M','L','XL']),
  ('oud-noir-eau-de-parfum', 'Oud Noir Eau de Parfum', 'A deep, warm signature scent.', 'fragrance', 2850.00, 3277.50, '{}'),
  ('classic-ivory-punjabi', 'Classic Ivory Punjabi', 'A clean classic for every occasion.', 'punjabi', 2650.00, 3180.00, ARRAY['S','M','L','XL']),
  ('linen-sand-punjabi', 'Linen Sand Punjabi', 'Lightweight and thoughtfully tailored.', 'punjabi', 2950.00, 3540.00, ARRAY['S','M','L','XL']),
  ('amber-oud-eau-de-parfum', 'Amber Oud Eau de Parfum', 'Amber and oud in a warm blend.', 'fragrance', 1250.00, 1437.50, '{}'),
  ('fresh-citrus-eau-de-parfum', 'Fresh Citrus Eau de Parfum', 'A fresh and bright daily fragrance.', 'fragrance', 1950.00, 2242.50, '{}')
ON CONFLICT (slug) DO NOTHING;
