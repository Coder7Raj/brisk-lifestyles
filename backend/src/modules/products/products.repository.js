import { pool } from "../../db/pool.js";

const columns = `id, slug, name, description, category, price_taka,
  compare_at_price_taka, image_url, sizes, stock_by_size, in_stock, is_active, created_at`;
const publicColumns = `id, slug, name, description, category, price_taka,
  compare_at_price_taka, image_url, sizes, stock_by_size, in_stock`;
const mutableColumns = {
  slug: "slug",
  name: "name",
  description: "description",
  category: "category",
  price_taka: "price_taka",
  compare_at_price_taka: "compare_at_price_taka",
  image_url: "image_url",
  sizes: "sizes",
  stock_by_size: "stock_by_size",
  in_stock: "in_stock",
  is_active: "is_active",
};

export async function listActive({ limit, offset, category }) {
  return pool.query(
    `SELECT ${publicColumns} FROM products
     WHERE is_active = true AND ($1::text IS NULL OR category = $1)
     ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
    [category || null, limit, offset],
  );
}

export async function listAll({ limit, offset, category }) {
  return pool.query(
    `SELECT ${columns} FROM products
     WHERE ($1::text IS NULL OR category = $1)
     ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
    [category || null, limit, offset],
  );
}

export async function findActiveBySlug(slug) {
  return pool.query(
    `SELECT ${publicColumns} FROM products WHERE slug = $1 AND is_active = true`,
    [slug],
  );
}

export async function hasActiveCategory(slug) {
  const result = await pool.query(
    "SELECT 1 FROM categories WHERE slug = $1 AND is_active = true",
    [slug],
  );
  return result.rowCount > 0;
}

export async function create(product) {
  const result = await pool.query(
    `INSERT INTO products
       (slug, name, description, category, price_taka, compare_at_price_taka, image_url, sizes, stock_by_size, in_stock)
     SELECT $1, $2, $3, c.slug, $5, $6, $7, $8, $9, $10
     FROM categories c WHERE c.slug = $4 AND c.is_active = true
     RETURNING ${columns}`,
    [
      product.slug,
      product.name,
      product.description,
      product.category,
      product.price_taka,
      product.compare_at_price_taka,
      product.image_url,
      product.sizes,
      JSON.stringify(product.stock_by_size),
      product.in_stock,
    ],
  );
  return result;
}

export async function update(id, product) {
  const entries = Object.entries(product);
  const assignments = entries.map(
    ([field], index) => `${mutableColumns[field]} = $${index + 1}`,
  );
  const values = entries.map(([, value]) => value);
  values.push(id);
  return pool.query(
    `UPDATE products SET ${assignments.join(", ")}
     WHERE id = $${values.length} AND is_active = true
     RETURNING ${columns}`,
    values,
  );
}

export async function softDelete(id) {
  return pool.query(
    `UPDATE products SET is_active = false
     WHERE id = $1 AND is_active = true RETURNING ${columns}`,
    [id],
  );
}
