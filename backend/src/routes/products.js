import { Router } from "express";
import { pool } from "../db/pool.js";

export const productsRouter = Router();

productsRouter.get("/", async (request, response, next) => {
  try {
    const limit = Math.min(Number(request.query.limit) || 50, 100);
    const offset = Math.max(Number(request.query.offset) || 0, 0);
    const category =
      typeof request.query.category === "string"
        ? request.query.category.trim().slice(0, 60)
        : null;
    const result = await pool.query(
      `SELECT id, slug, name, description, category, price_paisa, compare_at_price_paisa, image_url, sizes, in_stock
       FROM products WHERE is_active = true AND ($1::text IS NULL OR category = $1)
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [category || null, limit, offset],
    );
    response.json({ data: result.rows, limit, offset });
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:slug", async (request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT id, slug, name, description, category, price_paisa, compare_at_price_paisa, image_url, sizes, in_stock FROM products WHERE slug = $1 AND is_active = true",
      [request.params.slug],
    );
    if (!result.rowCount)
      return response.status(404).json({ error: "Product not found." });
    response.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
