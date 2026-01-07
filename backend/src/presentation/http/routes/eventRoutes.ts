import { Router } from "express";
import { EventController } from "../controllers/EventController";
import { requireAuth, requirePermission } from "../middlewares/authMiddleware";
import { requireCsrf } from "../middlewares/csrfMiddleware";
import { TokenService } from "../../../application/ports/TokenService";
import { AuditLogRepository } from "../../../application/ports/AuditLogRepository";
import { auditLogger } from "../middlewares/auditMiddleware";

export const buildEventRoutes = (
  controller: EventController,
  tokenService: TokenService,
  auditLogRepository: AuditLogRepository
) => {
  const router = Router();
  const auth = requireAuth(tokenService);

  router.use(auth);
  router.use(auditLogger(auditLogRepository, "EVENTS"));

  router.get(
    "/",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    controller.list
  );
  router.get(
    "/:id",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    controller.getById
  );

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
