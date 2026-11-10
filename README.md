# Brisk Lifestyles

A responsive fashion and fragrance storefront with a React/Vite frontend, Express API, and PostgreSQL database.

## Start locally

1. Start PostgreSQL with `docker compose up -d db`.
2. Create `backend/.env` with `DATABASE_URL=postgresql://brisk_app:local_dev_change_me@localhost:5432/brisk_lifestyles`, `WEB_ORIGIN=http://localhost:5173`, `PORT=4000`, and a `JWT_SECRET` containing at least 32 random characters.
3. From `backend`, run `npm install`, `npm run db:migrate`, and `npm run dev`.
4. From `frontend`, run `npm install` and `npm run dev`. Set `VITE_API_URL` only if the API is not at `http://localhost:4000/api`.

The migration applies the storefront schema in `database/schema.sql` and the separate PostgreSQL `identity` schema in `database/users.sql`. The API health endpoint is `/api/health`.

## SSLCOMMERZ sandbox payments

Configure `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX=true`, `PUBLIC_API_URL`, and `WEB_URL` in `backend/.env`. The Store Password must remain on the server. The payment notification URL is `${PUBLIC_API_URL}/api/orders/payment/ipn`; configure it in the SSLCOMMERZ merchant panel. The API needs a publicly reachable HTTPS URL for IPN and callback delivery, and the host must support TLS 1.2 or newer. Run `npm run db:migrate` after updating the backend. Online payments redirect to the SSLCOMMERZ hosted checkout; callback and IPN transactions are validated with the Order Validation API for status, transaction ID, BDT currency, and expected amount. Risk flagged transactions remain pending for manual review.

## Project layout

- `frontend/` React components, catalog data, styling, and Vite configuration.
- `backend/` Express application, shared middleware, and feature modules. Authentication is split into routes, controller, service, and repository layers under `src/modules/auth/`.
- `database/` PostgreSQL schema and seed data, also loaded by the migration script.

## Accounts and permissions

Registration and sign-in are available at `/register` and `/login`. Passwords are stored as scrypt hashes. Access and refresh tokens are returned only in HttpOnly cookies. Refresh tokens are random, stored as hashes in `identity.sessions`, and rotated when used. The browser API requests include credentials, so configure `WEB_ORIGIN` to the exact storefront origin. Production cookies require HTTPS.

Authentication uses an HTTP-only JWT access cookie that expires after 15 minutes and a rotating, database-backed refresh cookie that expires after 30 days. Protected API calls transparently refresh once when the access token expires. New accounts receive the `customer` role. The admin-only `GET /api/auth/users` endpoint requires the `admin` role. Promote a trusted account explicitly in PostgreSQL with `UPDATE identity.users SET role = 'admin' WHERE email = lower('staff@example.com');`. Orders require a signed-in account and are associated with its user record. Product and category reads remain public. The demo frontend catalog remains local-first; the API product catalog and orders are stored in PostgreSQL.

## Product API

Product reads are public. Product creation, editing, deletion, and the complete admin listing require a signed-in account with the `admin` role. Mutations also enforce the configured storefront origin, validate request bodies, and are rate limited. Deletion is a soft delete (`is_active = false`) so existing order history retains its product references.

- `GET /api/products?limit=50&offset=0&category=punjabi` lists active products.
- `GET /api/products/:slug` returns one active product.
- `GET /api/products/admin?limit=50&offset=0` lists active and inactive products for admins.
- `POST /api/products` creates a product.
- `PATCH /api/products/:id` updates one or more product fields.
- `DELETE /api/products/:id` soft deletes a product.

Create and update bodies use the database field names, such as `price_taka`, `compare_at_price_taka`, `image_url`, `in_stock`, and `is_active`. Prices are stored in taka with up to two decimal places. For example:

```json
{
  "slug": "blue-cotton-punjabi",
  "name": "Blue Cotton Punjabi",
  "description": "Lightweight cotton for everyday wear.",
  "category": "punjabi",
  "price_taka": 2450.00,
  "compare_at_price_taka": 2940.00,
  "image_url": "https://example.com/blue-punjabi.jpg",
  "sizes": ["S", "M", "L", "XL"],
  "in_stock": true
}
```

Running the backend database migration command applies `database/migrations/20261110_prices_in_taka.sql` before the updated schema. It converts existing product prices and order totals to taka and skips conversion on a fresh or already-updated database.
