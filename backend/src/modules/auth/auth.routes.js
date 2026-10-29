import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { requireSameOrigin } from "../../middleware/origin.js";
import * as controller from "./auth.controller.js";

export const authRouter = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
});
const asyncRoute = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

authRouter.post("/register", requireSameOrigin, authLimit, asyncRoute(controller.register));
authRouter.post("/login", requireSameOrigin, authLimit, asyncRoute(controller.login));
authRouter.post("/logout", requireSameOrigin, asyncRoute(controller.logout));
authRouter.get("/me", requireAuth, asyncRoute(controller.me));
authRouter.get("/users", requireAuth, requireRole("admin"), asyncRoute(controller.users));
