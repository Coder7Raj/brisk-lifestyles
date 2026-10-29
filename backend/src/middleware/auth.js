import { getSessionUser } from "../modules/auth/auth.service.js";

const COOKIE_NAME = "brisk_session";

export function sessionToken(request) {
  const cookie = request.headers.cookie?.split(";").map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
}

export async function requireAuth(request, response, next) {
  const token = sessionToken(request);
  if (!token) return response.status(401).json({ error: "Sign in to continue." });
  try {
    const user = await getSessionUser(token);
    if (!user) return response.status(401).json({ error: "Your session has expired. Sign in again." });
    request.user = user;
    request.sessionToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user) return response.status(401).json({ error: "Sign in to continue." });
    if (!roles.includes(request.user.role)) return response.status(403).json({ error: "You do not have permission to access this resource." });
    return next();
  };
}
