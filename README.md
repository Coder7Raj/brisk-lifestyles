# Brisk Lifestyles

A responsive fashion and fragrance storefront with a React/Vite frontend, Express API, and PostgreSQL database.

## Start locally

1. Start PostgreSQL with `docker compose up -d db`.
2. Create `backend/.env` with `DATABASE_URL=postgresql://brisk_app:local_dev_change_me@localhost:5432/brisk_lifestyles`, `WEB_ORIGIN=http://localhost:5173`, and `PORT=4000`.
3. From `backend`, run `npm install`, `npm run db:migrate`, and `npm run dev`.
4. From `frontend`, run `npm install` and `npm run dev`. Set `VITE_API_URL` only if the API is not at `http://localhost:4000/api`.

The migration applies the storefront schema in `database/schema.sql` and the separate PostgreSQL `identity` schema in `database/users.sql`. The API health endpoint is `/api/health`.

## Project layout

- `frontend/` React components, catalog data, styling, and Vite configuration.
- `backend/` Express application, shared middleware, and feature modules. Authentication is split into routes, controller, service, and repository layers under `src/modules/auth/`.
- `database/` PostgreSQL schema and seed data, also loaded by the migration script.

## Accounts and permissions

Registration and sign-in are available at `/register` and `/login`. Passwords are stored as scrypt hashes; session tokens are random, stored as hashes in `identity.sessions`, and returned only in an HttpOnly cookie. Sessions last 30 days. The browser API requests include credentials, so configure `WEB_ORIGIN` to the exact storefront origin. Production cookies require HTTPS.

New accounts receive the `customer` role. The admin-only `GET /api/auth/users` endpoint requires the `admin` role. Promote a trusted account explicitly in PostgreSQL with `UPDATE identity.users SET role = 'admin' WHERE email = lower('staff@example.com');`. Orders require a signed-in account and are associated with its user record. Product and category reads remain public. The demo frontend catalog remains local-first; the API product catalog and orders are stored in PostgreSQL.
