import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSameOrigin } from "../middleware/origin.js";
import { config } from "../config.js";

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
    paymentMethod: z.enum(["cod", "sslcommerz"]).default("cod"),
    customerName: z.string().trim().min(2).max(120),
    email: z.string().email().max(254),
    phone: z.string().trim().min(8).max(18),
    address: z.string().trim().min(3).max(300),
    city: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(2).max(20),
    notes: z.string().trim().max(500).optional().default(""),
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
      "INSERT INTO orders (user_id, email, customer_name, phone, delivery_address, subtotal_taka, status, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, status, payment_method, subtotal_taka, created_at",
      [request.user.id, input.email, input.customerName, input.phone, JSON.stringify({ address: input.address, city: input.city, postalCode: input.postalCode, notes: input.notes }), subtotal, "pending", input.paymentMethod],
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
    if (input.paymentMethod === "cod") return response.status(201).json({ data: order.rows[0] });
    if (!config.sslcommerzStoreId || !config.sslcommerzStorePassword || !config.publicApiUrl) {
      await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.rows[0].id]);
      return response.status(503).json({ error: "Online payment is not configured yet." });
    }
    const shipping = subtotal >= 5000 ? 0 : subtotal ? 80 : 0;
    const amount = Number((subtotal + shipping).toFixed(2));
    if (amount < 10) {
      await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.rows[0].id]);
      return response.status(400).json({ error: "SSLCOMMERZ requires a minimum payment of ৳10." });
    }
    const transactionId = `BRISK-${order.rows[0].id}`;
    const callbackBase = `${config.publicApiUrl.replace(/\/$/, "")}/api/orders/payment`;
    await pool.query("UPDATE orders SET transaction_id = $1 WHERE id = $2", [transactionId, order.rows[0].id]);
    const gateway = config.sslcommerzSandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
    const params = new URLSearchParams({
      store_id: config.sslcommerzStoreId, store_passwd: config.sslcommerzStorePassword,
      total_amount: amount.toFixed(2), currency: "BDT", tran_id: transactionId,
      success_url: `${callbackBase}/success`, fail_url: `${callbackBase}/fail`, cancel_url: `${callbackBase}/cancel`,
      ipn_url: `${callbackBase}/ipn`, cus_name: input.customerName, cus_email: input.email,
      cus_add1: input.address, cus_city: input.city, cus_postcode: input.postalCode,
      cus_country: "Bangladesh", cus_phone: input.phone, shipping_method: "NO",
      product_name: "Brisk Lifestyles order", product_category: "Fashion and fragrance", product_profile: "general",
    });
    const sessionResponse = await fetch(`${gateway}/gwprocess/v4/api.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params });
    const session = await sessionResponse.json();
    if (!sessionResponse.ok || session.status !== "SUCCESS" || !session.GatewayPageURL) {
      await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.rows[0].id]);
      return response.status(502).json({ error: "Could not start the payment session. Please try again." });
    }
    await pool.query("UPDATE orders SET gateway_session_key = $1 WHERE id = $2", [session.sessionkey || null, order.rows[0].id]);
    response.status(201).json({ data: { ...order.rows[0], paymentUrl: session.GatewayPageURL } });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client?.release();
  }
});

async function validateAndUpdate(payload) {
  const tranId = String(payload.tran_id || "");
  const orderResult = await pool.query("SELECT id, subtotal_taka, transaction_id, status FROM orders WHERE transaction_id = $1", [tranId]);
  const order = orderResult.rows[0];
  if (!order || order.status === "paid" || !payload.val_id) return false;
  const validator = config.sslcommerzSandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
  const query = new URLSearchParams({ val_id: String(payload.val_id), store_id: config.sslcommerzStoreId, store_passwd: config.sslcommerzStorePassword, format: "json" });
  const result = await fetch(`${validator}/validator/api/validationserverAPI.php?${query}`);
  const validation = await result.json();
  const shipping = Number(order.subtotal_taka) >= 5000 ? 0 : Number(order.subtotal_taka) ? 80 : 0;
  const expectedAmount = (Number(order.subtotal_taka) + shipping).toFixed(2);
  const valid = result.ok && ["VALID", "VALIDATED"].includes(validation.status) && validation.tran_id === order.transaction_id && validation.currency_type === "BDT" && validation.currency === "BDT" && Number(validation.currency_amount).toFixed(2) === expectedAmount && Number(validation.amount).toFixed(2) === expectedAmount;
  if (!valid) return false;
  const risky = String(validation.risk_level ?? payload.risk_level ?? "0") === "1";
  await pool.query("UPDATE orders SET status = $1, gateway_val_id = $2, risk_level = $3 WHERE id = $4", [risky ? "pending" : "paid", String(payload.val_id), risky ? 1 : 0, order.id]);
  return !risky;
}

ordersRouter.post("/payment/ipn", async (request, response, next) => {
  try {
    const status = String(request.body.status || "").toUpperCase();
    if (["FAILED", "CANCELLED", "EXPIRED", "UNATTEMPTED"].includes(status) && request.body.tran_id) {
      await pool.query("UPDATE orders SET status = 'cancelled' WHERE transaction_id = $1 AND status = 'pending'", [String(request.body.tran_id)]);
    } else {
      await validateAndUpdate(request.body);
    }
    response.status(200).send("OK");
  } catch (error) { next(error); }
});

for (const result of ["success", "fail", "cancel"]) {
  ordersRouter.post(`/payment/${result}`, async (request, response, next) => {
    try {
      if (result !== "success" && request.body.tran_id) {
        await pool.query("UPDATE orders SET status = 'cancelled' WHERE transaction_id = $1 AND status = 'pending'", [String(request.body.tran_id)]);
      }
      const paid = result === "success" && await validateAndUpdate(request.body);
      const state = paid ? "success" : result === "success" ? "pending" : result;
      response.redirect(303, `${config.webUrl.replace(/\/$/, "")}/checkout?payment=${state}`);
    } catch (error) { next(error); }
  });
}
