import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireSameOrigin } from "../middleware/origin.js";

export const ordersRouter = Router();
const orderStatusSchema = z
  .object({ status: z.enum(["paid", "cancelled"]) })
  .strict();
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

ordersRouter.get(
  "/admin/stats",
  requireAuth,
  requireRole("admin"),
  async (request, response, next) => {
    try {
      const result = await pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM products) AS total_products,
           (SELECT COALESCE(SUM(subtotal_taka), 0)
            FROM orders WHERE status IN ('paid', 'fulfilled')) AS total_payments,
           (SELECT COUNT(*)::int FROM orders WHERE status = 'cancelled') AS cancelled_orders,
           (SELECT COUNT(*)::int FROM identity.users) AS total_users`,
      );
      response.json({ data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

ordersRouter.get(
  "/admin",
  requireAuth,
  requireRole("admin"),
  async (request, response, next) => {
    try {
      const result = await pool.query(
        `SELECT o.id, o.user_id, o.email, o.customer_name, o.phone,
                o.delivery_address, o.status, o.payment_method,
                o.subtotal_taka, o.created_at, u.display_name AS account_name,
                COALESCE(json_agg(json_build_object(
                  'productId', oi.product_id, 'name', p.name,
                  'quantity', oi.quantity, 'size', oi.size,
                  'unitPrice', oi.unit_price_taka
                ) ORDER BY p.name) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) AS items
         FROM orders o
         LEFT JOIN identity.users u ON u.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products p ON p.id = oi.product_id
         GROUP BY o.id, u.display_name
         ORDER BY o.created_at DESC
         LIMIT 200`,
      );
      response.json({ data: result.rows });
    } catch (error) {
      next(error);
    }
  },
);

ordersRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  requireSameOrigin,
  async (request, response, next) => {
    try {
      const id = z.string().uuid().parse(request.params.id);
      const { status } = orderStatusSchema.parse(request.body);
      const result = await pool.query(
        "UPDATE orders SET status = $1 WHERE id = $2 AND status = 'pending' RETURNING id, status",
        [status, id],
      );
      if (!result.rowCount) {
        const existing = await pool.query(
          "SELECT 1 FROM orders WHERE id = $1",
          [id],
        );
        return response.status(existing.rowCount ? 409 : 404).json({
          error: existing.rowCount
            ? "This order has already been updated. Refresh and try again."
            : "Order not found.",
        });
      }
      response.json({ data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

ordersRouter.post(
  "/",
  requireAuth,
  requireSameOrigin,
  async (request, response, next) => {
    let client;
    try {
      const input = orderSchema.parse(request.body);
      client = await pool.connect();
      await client.query("BEGIN");
      const ids = [...new Set(input.items.map((item) => item.productId))];
      const { rows: products } = await client.query(
        "SELECT id, price_taka, in_stock, sizes, stock_by_size FROM products WHERE id = ANY($1::uuid[]) AND is_active = true FOR UPDATE",
        [ids],
      );
      const byId = new Map(products.map((item) => [item.id, item]));
      if (ids.some((id) => !byId.has(id))) {
        await client.query("ROLLBACK");
        return response
          .status(400)
          .json({ error: "One or more products are unavailable." });
      }
      const requestedBySize = new Map();
      for (const item of input.items) {
        if (!item.size) continue;
        const key = `${item.productId}:${item.size}`;
        requestedBySize.set(
          key,
          (requestedBySize.get(key) || 0) + item.quantity,
        );
      }
      for (const [key, quantity] of requestedBySize) {
        const separator = key.lastIndexOf(":");
        const product = byId.get(key.slice(0, separator));
        const size = key.slice(separator + 1);
        if (!product.in_stock) {
          await client.query("ROLLBACK");
          return response
            .status(400)
            .json({ error: `${product.name} is out of stock.` });
        }
        if (!product.sizes.includes(size)) {
          await client.query("ROLLBACK");
          return response
            .status(400)
            .json({ error: `${product.name} is unavailable in size ${size}.` });
        }
        const available = Number(product.stock_by_size?.[size] || 0);
        if (available < quantity) {
          await client.query("ROLLBACK");
          return response.status(400).json({
            error: `${product.name} (size ${size}) has only ${available} in stock, but ${quantity} requested.`,
          });
        }
      }
      for (const item of input.items) {
        const product = byId.get(item.productId);
        if (!product.in_stock) {
          await client.query("ROLLBACK");
          return response
            .status(400)
            .json({ error: `${product.name} is out of stock.` });
        }
        if (product.sizes.length && !item.size) {
          await client.query("ROLLBACK");
          return response.status(400).json({
            error: `Select a size for ${product.name} before placing your order.`,
          });
        }
        if (!product.sizes.length && item.size) {
          await client.query("ROLLBACK");
          return response.status(400).json({
            error: `${product.name} does not have selectable sizes. Remove it from your bag and add it again.`,
          });
        }
      }
      const stockByProduct = new Map();
      for (const [key, quantity] of requestedBySize) {
        const separator = key.lastIndexOf(":");
        const productId = key.slice(0, separator);
        const size = key.slice(separator + 1);
        const stock = stockByProduct.get(productId) || {
          ...(byId.get(productId).stock_by_size || {}),
        };
        stock[size] = Number(stock[size] || 0) - quantity;
        stockByProduct.set(productId, stock);
      }
      for (const [productId, stock] of stockByProduct) {
        await client.query(
          "UPDATE products SET stock_by_size = $1 WHERE id = $2",
          [JSON.stringify(stock), productId],
        );
      }
      const subtotal =
        input.items.reduce(
          (sum, item) =>
            sum +
            Math.round(Number(byId.get(item.productId).price_taka) * 100) *
              item.quantity,
          0,
        ) / 100;
      const order = await client.query(
        "INSERT INTO orders (user_id, email, customer_name, phone, delivery_address, subtotal_taka, status, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, status, payment_method, subtotal_taka, created_at",
        [
          request.user.id,
          input.email,
          input.customerName,
          input.phone,
          JSON.stringify({
            address: input.address,
            city: input.city,
            postalCode: input.postalCode,
            notes: input.notes,
          }),
          subtotal,
          "pending",
          input.paymentMethod,
        ],
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
      if (input.paymentMethod === "cod")
        return response.status(201).json({ data: order.rows[0] });
      if (
        !config.sslcommerzStoreId ||
        !config.sslcommerzStorePassword ||
        !config.publicApiUrl
      ) {
        await pool.query(
          "UPDATE orders SET status = 'cancelled' WHERE id = $1",
          [order.rows[0].id],
        );
        return response
          .status(503)
          .json({ error: "Online payment is not configured yet." });
      }
      const shipping = subtotal >= 5000 ? 0 : subtotal ? 80 : 0;
      const amount = Number((subtotal + shipping).toFixed(2));
      if (amount < 10) {
        await pool.query(
          "UPDATE orders SET status = 'cancelled' WHERE id = $1",
          [order.rows[0].id],
        );
        return response
          .status(400)
          .json({ error: "SSLCOMMERZ requires a minimum payment of ৳10." });
      }
      const transactionId = `BRISK-${order.rows[0].id}`;
      const apiBase = config.publicApiUrl
        .replace(/\/+$/, "")
        .replace(/(?:\/api)+$/i, "");
      const callbackBase = `${apiBase}/api/orders/payment`;
      await pool.query("UPDATE orders SET transaction_id = $1 WHERE id = $2", [
        transactionId,
        order.rows[0].id,
      ]);
      const gateway = config.sslcommerzSandbox
        ? "https://sandbox.sslcommerz.com"
        : "https://securepay.sslcommerz.com";
      const params = new URLSearchParams({
        store_id: config.sslcommerzStoreId,
        store_passwd: config.sslcommerzStorePassword,
        total_amount: amount.toFixed(2),
        currency: "BDT",
        tran_id: transactionId,
        success_url: `${callbackBase}/success`,
        fail_url: `${callbackBase}/fail`,
        cancel_url: `${callbackBase}/cancel`,
        ipn_url: `${callbackBase}/ipn`,
        cus_name: input.customerName,
        cus_email: input.email,
        cus_add1: input.address,
        cus_city: input.city,
        cus_postcode: input.postalCode,
        cus_country: "Bangladesh",
        cus_phone: input.phone,
        shipping_method: "NO",
        product_name: "Brisk Lifestyles order",
        product_category: "Fashion and fragrance",
        product_profile: "general",
      });
      const sessionResponse = await fetch(`${gateway}/gwprocess/v4/api.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const session = await sessionResponse.json();
      if (
        !sessionResponse.ok ||
        session.status !== "SUCCESS" ||
        !session.GatewayPageURL
      ) {
        await pool.query(
          "UPDATE orders SET status = 'cancelled' WHERE id = $1",
          [order.rows[0].id],
        );
        return response.status(502).json({
          error: "Could not start the payment session. Please try again.",
        });
      }
      await pool.query(
        "UPDATE orders SET gateway_session_key = $1 WHERE id = $2",
        [session.sessionkey || null, order.rows[0].id],
      );
      response.status(201).json({
        data: { ...order.rows[0], paymentUrl: session.GatewayPageURL },
      });
    } catch (error) {
      if (client) await client.query("ROLLBACK").catch(() => {});
      next(error);
    } finally {
      client?.release();
    }
  },
);

async function validateAndUpdate(payload) {
  const tranId = String(payload.tran_id || "");
  const orderResult = await pool.query(
    "SELECT id, subtotal_taka, transaction_id, status FROM orders WHERE transaction_id = $1",
    [tranId],
  );
  const order = orderResult.rows[0];
  if (!order || order.status === "paid" || !payload.val_id) return false;
  const validator = config.sslcommerzSandbox
    ? "https://sandbox.sslcommerz.com"
    : "https://securepay.sslcommerz.com";
  const query = new URLSearchParams({
    val_id: String(payload.val_id),
    store_id: config.sslcommerzStoreId,
    store_passwd: config.sslcommerzStorePassword,
    format: "json",
  });
  const result = await fetch(
    `${validator}/validator/api/validationserverAPI.php?${query}`,
  );
  const validation = await result.json();
  const shipping =
    Number(order.subtotal_taka) >= 5000
      ? 0
      : Number(order.subtotal_taka)
        ? 80
        : 0;
  const expectedAmount = (Number(order.subtotal_taka) + shipping).toFixed(2);
  const valid =
    result.ok &&
    ["VALID", "VALIDATED"].includes(validation.status) &&
    validation.tran_id === order.transaction_id &&
    validation.currency_type === "BDT" &&
    validation.currency === "BDT" &&
    Number(validation.currency_amount).toFixed(2) === expectedAmount &&
    Number(validation.amount).toFixed(2) === expectedAmount;
  if (!valid) return false;
  const risky =
    String(validation.risk_level ?? payload.risk_level ?? "0") === "1";
  await pool.query(
    "UPDATE orders SET status = $1, gateway_val_id = $2, risk_level = $3 WHERE id = $4",
    [
      risky ? "pending" : "paid",
      String(payload.val_id),
      risky ? 1 : 0,
      order.id,
    ],
  );
  return !risky;
}

ordersRouter.post("/payment/ipn", async (request, response, next) => {
  try {
    const status = String(request.body.status || "").toUpperCase();
    if (
      ["FAILED", "CANCELLED", "EXPIRED", "UNATTEMPTED"].includes(status) &&
      request.body.tran_id
    ) {
      await pool.query(
        "UPDATE orders SET status = 'cancelled' WHERE transaction_id = $1 AND status = 'pending'",
        [String(request.body.tran_id)],
      );
    } else {
      await validateAndUpdate(request.body);
    }
    response.status(200).send("OK");
  } catch (error) {
    next(error);
  }
});

for (const result of ["success", "fail", "cancel"]) {
  ordersRouter.post(`/payment/${result}`, async (request, response, next) => {
    try {
      if (result !== "success" && request.body.tran_id) {
        await pool.query(
          "UPDATE orders SET status = 'cancelled' WHERE transaction_id = $1 AND status = 'pending'",
          [String(request.body.tran_id)],
        );
      }
      const paid =
        result === "success" && (await validateAndUpdate(request.body));
      const state = paid
        ? "success"
        : result === "success"
          ? "pending"
          : result;
      response.redirect(
        303,
        `${config.webUrl.replace(/\/$/, "")}/checkout?payment=${state}`,
      );
    } catch (error) {
      next(error);
    }
  });
}
