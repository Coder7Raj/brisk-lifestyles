import { pool } from "../../db/pool.js";

export async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT id, display_name, email, avatar_url, password_hash, role, is_active FROM identity.users WHERE email = $1",
    [email],
  );
  return result.rows[0] || null;
}

export async function createUser({ displayName, email, avatarUrl, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO identity.users (display_name, email, avatar_url, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, display_name, email, avatar_url, role, created_at`,
    [displayName, email, avatarUrl, passwordHash],
  );
  return result.rows[0];
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

export async function revokeSession(tokenHash) {
  await pool.query(
    "UPDATE identity.sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
    [tokenHash],
  );
}

export async function listUsers() {
  const result = await pool.query(
    `SELECT id, display_name, email, avatar_url, role, is_active, created_at
     FROM identity.users ORDER BY created_at DESC LIMIT 200`,
  );
  return result.rows;
}
