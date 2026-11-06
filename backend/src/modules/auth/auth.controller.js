import { z } from "zod";
import { config } from "../../config.js";
import * as authService from "./auth.service.js";

const registerSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    avatarUrl: z
      .string()
      .trim()
      .max(2048)
      .url()
      .refine(
        (value) => new URL(value).protocol === "https:",
        "Use a secure HTTPS image URL.",
      )
      .optional()
      .or(z.literal("")),
    password: z.string().min(10).max(128),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();

const ACCESS_COOKIE = process.env.ACCESS_COOKIE;
const REFRESH_COOKIE = process.env.REFRESH_COOKIE;
const ACCESS_SECONDS = process.env.ACCESS_SECONDS;
const REFRESH_SECONDS = process.env.REFRESH_SECONDS;

function setCookie(response, name, token, maxAge) {
  const sameSite = config.nodeEnv === "production" ? "None" : "Lax";
  const secure = config.nodeEnv === "production" ? "; Secure" : "";
  const existing = response.getHeader("Set-Cookie") || [];
  response.setHeader("Set-Cookie", [
    ...(Array.isArray(existing) ? existing : [existing]),
    `${name}=${encodeURIComponent(token)}; Path=/api; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${secure}`,
  ]);
}

function clearAuthCookies(response) {
  setCookie(response, ACCESS_COOKIE, "", 0);
  setCookie(response, REFRESH_COOKIE, "", 0);
}

function setAuthCookies(response, user, session) {
  setCookie(
    response,
    ACCESS_COOKIE,
    authService.createAccessToken(user),
    ACCESS_SECONDS,
  );
  setCookie(response, REFRESH_COOKIE, session.token, REFRESH_SECONDS);
}

function publicUser(user) {
  return {
    id: user.id,
    displayName: user.display_name,
    email: user.email,
    avatarUrl: user.avatar_url || null,
    role: user.role,
  };
}

export async function register(request, response) {
  const input = registerSchema.parse(request.body);
  let user;
  try {
    user = await authService.register(input);
  } catch (error) {
    if (error.code === "23505")
      return response
        .status(409)
        .json({ error: "An account with this email already exists." });
    throw error;
  }
  const session = await authService.startSession(user.id);
  setAuthCookies(response, user, session);
  response.status(201).json({ data: { user: publicUser(user) } });
}

export async function login(request, response) {
  const input = loginSchema.parse(request.body);
  const user = await authService.authenticate(input);
  if (!user)
    return response
      .status(401)
      .json({ error: "Email or password is incorrect." });
  const session = await authService.startSession(user.id);
  setAuthCookies(response, user, session);
  response.json({ data: { user: publicUser(user) } });
}

export function me(request, response) {
  response.json({ data: { user: publicUser(request.user) } });
}

export async function logout(request, response) {
  const token = refreshToken(request);
  if (token) await authService.endSession(token);
  clearAuthCookies(response);
  response.status(204).end();
}

function refreshToken(request) {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${REFRESH_COOKIE}=`));
  return cookie
    ? decodeURIComponent(cookie.slice(REFRESH_COOKIE.length + 1))
    : null;
}

export async function refresh(request, response) {
  const token = refreshToken(request);
  if (!token) {
    clearAuthCookies(response);
    return response
      .status(401)
      .json({ error: "Your session has expired. Sign in again." });
  }
  const result = await authService.rotateSession(token);
  if (!result) {
    clearAuthCookies(response);
    return response
      .status(401)
      .json({ error: "Your session has expired. Sign in again." });
  }
  setAuthCookies(response, result.user, result.session);
  response.json({ data: { user: publicUser(result.user) } });
}

export async function users(_request, response) {
  const data = await authService.getUsers();
  response.json({ data });
}
