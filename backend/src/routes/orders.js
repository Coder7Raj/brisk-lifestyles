import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

export const ordersRouter = Router();
const orderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1).max(10),
          size: z.string().trim().max(12).optional(),
        }),
      )
      .min(1)
      .max(30),
  })
  .strict();

ordersRouter.post("/", requireAuth, async (request, response, next) => {
  let client;
  try {
    const input = orderSchema.parse(request.body);
    client = await pool.connect();
    await client.query("BEGIN");
    const ids = [...new Set(input.items.map((item) => item.productId))];
    const { rows: products } = await client.query(
      "SELECT id, price_paisa, in_stock, sizes FROM products WHERE id = ANY($1::uuid[]) AND is_active = true FOR UPDATE",
      [ids],
    );
    const byId = new Map(products.map((item) => [item.id, item]));
    if (ids.some((id) => !byId.has(id))) {
      await client.query("ROLLBACK");
      return response
        .status(400)
        .json({ error: "One or more products are unavailable." });
    }
    for (const item of input.items) {
      const product = byId.get(item.productId);
      if (
        !product.in_stock ||
        (item.size && !product.sizes.includes(item.size))
      ) {
        await client.query("ROLLBACK");
        return response
          .status(400)
          .json({ error: "A selected product or size is unavailable." });
      }
    }
    const subtotal = input.items.reduce(
      (sum, item) =>
        sum + Number(byId.get(item.productId).price_paisa) * item.quantity,
      0,
    );
    const order = await client.query(
      "INSERT INTO orders (user_id, email, subtotal_paisa, status) VALUES ($1, $2, $3, $4) RETURNING id, status, subtotal_paisa, created_at",
      [request.user.id, request.user.email, subtotal, "pending"],
    );
    for (const item of input.items) {
      const product = byId.get(item.productId);
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price_paisa, size) VALUES ($1, $2, $3, $4, $5)",
        [
          order.rows[0].id,
          item.productId,
          item.quantity,
          product.price_paisa,
          item.size || null,
        ],
      );
    }
    await client.query("COMMIT");
    response.status(201).json({ data: order.rows[0] });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client?.release();
  }
});
