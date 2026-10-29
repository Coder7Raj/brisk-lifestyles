import { z } from "zod";
import { config } from "../../config.js";
import { sessionToken } from "../../middleware/auth.js";
import * as authService from "./auth.service.js";

const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  avatarUrl: z.string().trim().max(2048).url().refine((value) => new URL(value).protocol === "https:", "Use a secure HTTPS image URL.").optional().or(z.literal("")),
  password: z.string().min(10).max(128),
}).strict();
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
}).strict();
const COOKIE_NAME = "brisk_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;

function setSessionCookie(response, token, maxAge = SESSION_SECONDS) {
  const sameSite = config.nodeEnv === "production" ? "None" : "Lax";
  const secure = config.nodeEnv === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${secure}`);
}

function publicUser(user) {
  return { id: user.id, displayName: user.display_name, email: user.email, avatarUrl: user.avatar_url || null, role: user.role };
}

export async function register(request, response) {
  const input = registerSchema.parse(request.body);
  let user;
  try {
    user = await authService.register(input);
  } catch (error) {
    if (error.code === "23505") return response.status(409).json({ error: "An account with this email already exists." });
    throw error;
  }
  const session = await authService.startSession(user.id);
  setSessionCookie(response, session.token);
  response.status(201).json({ data: { user: publicUser(user) } });
}

export async function login(request, response) {
  const input = loginSchema.parse(request.body);
  const user = await authService.authenticate(input);
  if (!user) return response.status(401).json({ error: "Email or password is incorrect." });
  const session = await authService.startSession(user.id);
  setSessionCookie(response, session.token);
  response.json({ data: { user: publicUser(user) } });
}

export function me(request, response) {
  response.json({ data: { user: publicUser(request.user) } });
}

export async function logout(request, response) {
  const token = sessionToken(request);
  if (token) await authService.endSession(token);
  setSessionCookie(response, "", 0);
  response.status(204).end();
}

export async function users(_request, response) {
  const data = await authService.getUsers();
  response.json({ data });
}
