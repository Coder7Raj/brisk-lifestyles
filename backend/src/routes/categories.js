import { Router } from "express";
import { pool } from "../db/pool.js";

export const categoriesRouter = Router();
categoriesRouter.get("/", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT id, slug, name, description FROM categories WHERE is_active = true ORDER BY sort_order, name",
    );
    response.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});
