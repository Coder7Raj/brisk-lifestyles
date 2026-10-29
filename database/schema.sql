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
  price_paisa integer NOT NULL CHECK (price_paisa >= 0),
  compare_at_price_paisa integer CHECK (compare_at_price_paisa >= price_paisa),
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
  subtotal_paisa bigint NOT NULL CHECK (subtotal_paisa >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'fulfilled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  unit_price_paisa integer NOT NULL CHECK (unit_price_paisa >= 0),
  size text
);

INSERT INTO categories (slug, name, description, sort_order) VALUES
  ('punjabi', 'Punjabi', 'Everyday and occasion wear', 1),
  ('kurti', 'Kurti', 'Comfortable styles for women', 2),
  ('pajama', 'Pajama', 'Pair with your favorite punjabi', 3),
  ('fragrance', 'Fragrance', 'Perfume, eau de parfum and attar', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (slug, name, description, category, price_paisa, compare_at_price_paisa, sizes) VALUES
  ('festive-gold-punjabi', 'Festive Gold Punjabi', 'A festive favorite in soft cotton.', 'punjabi', 425000, 510000, ARRAY['S','M','L','XL']),
  ('everyday-indigo-punjabi', 'Everyday Indigo Punjabi', 'An easy everyday cotton style.', 'punjabi', 245000, 294000, ARRAY['S','M','L','XL']),
  ('oud-noir-eau-de-parfum', 'Oud Noir Eau de Parfum', 'A deep, warm signature scent.', 'fragrance', 285000, 327750, '{}'),
  ('classic-ivory-punjabi', 'Classic Ivory Punjabi', 'A clean classic for every occasion.', 'punjabi', 265000, 318000, ARRAY['S','M','L','XL']),
  ('linen-sand-punjabi', 'Linen Sand Punjabi', 'Lightweight and thoughtfully tailored.', 'punjabi', 295000, 354000, ARRAY['S','M','L','XL']),
  ('amber-oud-eau-de-parfum', 'Amber Oud Eau de Parfum', 'Amber and oud in a warm blend.', 'fragrance', 125000, 143750, '{}'),
  ('fresh-citrus-eau-de-parfum', 'Fresh Citrus Eau de Parfum', 'A fresh and bright daily fragrance.', 'fragrance', 195000, 224250, '{}')
ON CONFLICT (slug) DO NOTHING;
