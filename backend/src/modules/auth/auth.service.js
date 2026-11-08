import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { config } from "../../config.js";
import * as repository from "./auth.repository.js";

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;
const ACCESS_TOKEN_SECONDS = 15 * 60;
const PASSWORD_COST = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64, PASSWORD_COST);
  return `scrypt$16384$8$1$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, n, r, p, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt, expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: PASSWORD_COST.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

export function createAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: user.id, iat: now, exp: now + ACCESS_TOKEN_SECONDS }));
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", config.jwtSecret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyAccessToken(token) {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    const headerClaims = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (headerClaims.alg !== "HS256" || headerClaims.typ !== "JWT") return null;
    const unsigned = `${header}.${payload}`;
    const expected = createHmac("sha256", config.jwtSecret).update(unsigned).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (claims.exp <= Math.floor(Date.now() / 1000) || typeof claims.sub !== "string") return null;
    return claims;
  } catch {
    return null;
  }
}

export async function register({ displayName, email, avatarUrl, password }) {
  const passwordHash = await hashPassword(password);
  return repository.createUser({
    displayName: displayName.trim(),
    email: normalizeEmail(email),
    avatarUrl: avatarUrl || null,
    passwordHash,
  });
}

export function updateProfile(userId, profile) {
  return repository.updateProfile(userId, profile);
}

export async function authenticate({ email, password }) {
  const user = await repository.findUserByEmail(normalizeEmail(email));
  if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash)))
    return null;
  const { password_hash: _passwordHash, is_active: _isActive, ...safeUser } = user;
  return safeUser;
}

export async function startSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await repository.createSession({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

export async function rotateSession(token) {
  const user = await repository.findSessionUser(hashSessionToken(token));
  if (!user) return null;
  await repository.revokeSession(hashSessionToken(token));
  const session = await startSession(user.id);
  return { user, session };
}

export function getActiveUser(userId) {
  return repository.findActiveUserById(userId);
}

export function getSessionUser(token) {
  return repository.findSessionUser(hashSessionToken(token));
}

export function endSession(token) {
  return repository.revokeSession(hashSessionToken(token));
}

export function getUsers() {
  return repository.listUsers();
}
