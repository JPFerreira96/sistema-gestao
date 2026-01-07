import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/AuthController";
import { TokenService } from "../../../application/ports/TokenService";
import { requireAuth, requirePermission } from "../middlewares/authMiddleware";
import { requireCsrf } from "../middlewares/csrfMiddleware";
import { AuditLogRepository } from "../../../application/ports/AuditLogRepository";
import { auditLogger } from "../middlewares/auditMiddleware";

export const buildAuthRoutes = (
  controller: AuthController,
  tokenService: TokenService,
  auditLogRepository: AuditLogRepository
) => {
  const router = Router();
  const auth = requireAuth(tokenService);

  const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false
  });

  router.use(auditLogger(auditLogRepository, "AUTH"));

  router.post("/login", loginLimiter, controller.login);
  router.post("/refresh", controller.refresh);

  router.get("/me", auth, controller.me);
  router.post("/logout", auth, requireCsrf, controller.logout);

  router.post(
    "/credentials",
    auth,
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.createCredentials
  );

  router.post("/mfa/setup", auth, requireCsrf, controller.setupMfa);
  router.post("/mfa/verify", auth, requireCsrf, controller.verifyMfa);
  router.post("/mfa/disable", auth, requireCsrf, controller.disableMfa);

  return router;
};
