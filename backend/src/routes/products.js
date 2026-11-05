import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireSameOrigin } from "../middleware/origin.js";
import * as controller from "../modules/products/products.controller.js";

export const productsRouter = Router();
const asyncRoute = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);
const adminOnly = [requireAuth, requireRole("admin")];
const writeLimit = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many product changes. Try again later." },
});

// Keep this route before /:slug so "admin" is never treated as a slug.
productsRouter.get("/admin", ...adminOnly, asyncRoute(controller.listAll));
productsRouter.get("/", asyncRoute(controller.listPublic));
productsRouter.get("/:slug", asyncRoute(controller.getPublic));
productsRouter.post(
  "/",
  ...adminOnly,
  requireSameOrigin,
  writeLimit,
  asyncRoute(controller.create),
);
productsRouter.patch(
  "/:id",
  ...adminOnly,
  requireSameOrigin,
  writeLimit,
  asyncRoute(controller.update),
);
productsRouter.delete(
  "/:id",
  ...adminOnly,
  requireSameOrigin,
  writeLimit,
  asyncRoute(controller.remove),
);
