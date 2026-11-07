import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireSameOrigin } from "../middleware/origin.js";

export const categoriesRouter = Router();
const adminOnly = [requireAuth, requireRole("admin")];
const asyncRoute = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

categoriesRouter.get("/", asyncRoute(async (_request, response) => {
  const result = await pool.query(
    "SELECT id, slug, name, description FROM categories WHERE is_active = true ORDER BY sort_order, name",
  );
  response.json({ data: result.rows });
}));

categoriesRouter.post("/", ...adminOnly, requireSameOrigin, asyncRoute(async (request, response) => {
  const { name, slug, description = "" } = request.body || {};
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120 ||
      typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120 ||
      typeof description !== "string" || description.length > 500) {
    return response.status(400).json({ error: "Enter a valid category name and description." });
  }
  try {
    const result = await pool.query(
      "INSERT INTO categories (slug, name, description) VALUES ($1, $2, $3) RETURNING id, slug, name, description",
      [slug, name.trim(), description.trim()],
    );
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return response.status(409).json({ error: "A category with this name or URL already exists." });
    throw error;
  }
}));
