import { pool } from "../../db/pool.js";

export async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT id, display_name, email, avatar_url, password_hash, role, is_active FROM identity.users WHERE email = $1",
    [email],
  );
  return result.rows[0] || null;
}

export async function createUser({
  displayName,
  email,
  avatarUrl,
  passwordHash,
}) {
  const result = await pool.query(
    `INSERT INTO identity.users (display_name, email, avatar_url, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, display_name, email, avatar_url, role, created_at`,
    [displayName, email, avatarUrl, passwordHash],
  );
  return result.rows[0];
}

export async function updateProfile(userId, { displayName, avatarUrl }) {
  const result = await pool.query(
    `UPDATE identity.users
     SET display_name = $2, avatar_url = $3, updated_at = now()
     WHERE id = $1 AND is_active = true
     RETURNING id, display_name, email, avatar_url, role`,
    [userId, displayName, avatarUrl],
  );
  return result.rows[0] || null;
}

export async function createSession({ userId, tokenHash, expiresAt }) {
  await pool.query(
    "INSERT INTO identity.sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
}

export async function findSessionUser(tokenHash) {
  const result = await pool.query(
    `SELECT u.id, u.display_name, u.email, u.avatar_url, u.role
     FROM identity.sessions s
     JOIN identity.users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL
       AND s.expires_at > now() AND u.is_active = true`,
    [tokenHash],
  );
  return result.rows[0] || null;
}

export async function findActiveUserById(userId) {
  const result = await pool.query(
    "SELECT id, display_name, email, avatar_url, role FROM identity.users WHERE id = $1 AND is_active = true",
    [userId],
  );
  return result.rows[0] || null;
}

export async function revokeSession(tokenHash) {
  await pool.query(
    "UPDATE identity.sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
    [tokenHash],
  );
}

export async function listUsers() {
  const result = await pool.query(
    `SELECT u.id, u.display_name, u.email, u.avatar_url, u.role,
            u.is_active, u.created_at,
            COALESCE(purchases.order_count, 0)::int AS order_count,
            COALESCE(purchases.products_purchased, 0)::int AS products_purchased
     FROM identity.users u
     LEFT JOIN (
       SELECT o.user_id,
              COUNT(DISTINCT o.id) FILTER (WHERE o.status <> 'cancelled') AS order_count,
              COALESCE(SUM(oi.quantity) FILTER (WHERE o.status IN ('paid', 'fulfilled')), 0) AS products_purchased
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id IS NOT NULL
       GROUP BY o.user_id
     ) purchases ON purchases.user_id = u.id
     ORDER BY u.created_at DESC`,
  );
  return result.rows;
}
