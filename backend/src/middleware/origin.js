import { config } from "../config.js";

export function requireSameOrigin(request, response, next) {
  const origin = request.get("origin");
  if (origin && origin !== config.webOrigin)
    return response.status(403).json({ error: "Request origin is not allowed." });
  return next();
}
