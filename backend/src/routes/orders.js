import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSameOrigin } from "../middleware/origin.js";

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
    paymentMethod: z.enum(["cod", "mobile-banking"]).default("cod"),
  })
  .strict();

ordersRouter.get("/mine", requireAuth, async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.status, o.payment_method, o.subtotal_taka, o.created_at,
              COALESCE(json_agg(json_build_object(
                'name', p.name, 'quantity', oi.quantity, 'size', oi.size
              ) ORDER BY p.name) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [request.user.id],
    );
    response.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/", requireAuth, requireSameOrigin, async (request, response, next) => {
  let client;
  try {
    const input = orderSchema.parse(request.body);
    client = await pool.connect();
    await client.query("BEGIN");
    const ids = [...new Set(input.items.map((item) => item.productId))];
    const { rows: products } = await client.query(
      "SELECT id, price_taka, in_stock, sizes FROM products WHERE id = ANY($1::uuid[]) AND is_active = true FOR UPDATE",
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
        sum + Math.round(Number(byId.get(item.productId).price_taka) * 100) * item.quantity,
      0,
    ) / 100;
    const order = await client.query(
      "INSERT INTO orders (user_id, email, subtotal_taka, status, payment_method) VALUES ($1, $2, $3, $4, $5) RETURNING id, status, payment_method, subtotal_taka, created_at",
      [request.user.id, request.user.email, subtotal, "pending", input.paymentMethod],
    );
    for (const item of input.items) {
      const product = byId.get(item.productId);
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price_taka, size) VALUES ($1, $2, $3, $4, $5)",
        [
          order.rows[0].id,
          item.productId,
          item.quantity,
          product.price_taka,
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
