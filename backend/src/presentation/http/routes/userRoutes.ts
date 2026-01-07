import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { requireAuth, requirePermission } from "../middlewares/authMiddleware";
import { requireCsrf } from "../middlewares/csrfMiddleware";
import { TokenService } from "../../../application/ports/TokenService";
import { AuditLogRepository } from "../../../application/ports/AuditLogRepository";
import { auditLogger } from "../middlewares/auditMiddleware";

export const buildUserRoutes = (
  controller: UserController,
  tokenService: TokenService,
  auditLogRepository: AuditLogRepository
) => {
  const router = Router();
  const auth = requireAuth(tokenService);

  router.use(auth);
  router.use(auditLogger(auditLogRepository, "USERS"));

  router.get("/", controller.list);
  router.get("/:id", controller.getById);

  router.post(
    "/",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.create
  );

  router.put(
    "/:id",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.update
  );

  router.delete(
    "/:id",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.delete
  );

  return router;
};
