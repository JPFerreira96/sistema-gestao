import { Router } from "express";
import { EventAttendanceController } from "../controllers/EventAttendanceController";
import { requireAuth, requirePermission } from "../middlewares/authMiddleware";
import { requireCsrf } from "../middlewares/csrfMiddleware";
import { TokenService } from "../../../application/ports/TokenService";
import { AuditLogRepository } from "../../../application/ports/AuditLogRepository";
import { auditLogger } from "../middlewares/auditMiddleware";

export const buildEventAttendanceRoutes = (
  controller: EventAttendanceController,
  tokenService: TokenService,
  auditLogRepository: AuditLogRepository
) => {
  const router = Router();
  const auth = requireAuth(tokenService);

  router.use(auth);
  router.use(auditLogger(auditLogRepository, "EVENT_ATTENDANCE"));

  router.post(
    "/:eventId/assignments",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.setAssignments
  );

  router.get(
    "/:eventId/attendance",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    controller.getAttendance
  );

  router.post(
    "/:eventId/attendance",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.markAttendance
  );

  router.post(
    "/:eventId/observations",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.saveGeneralObservation
  );

  router.post(
    "/:eventId/observations/:operatorId",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    requireCsrf,
    controller.saveOperatorObservation
  );

  return router;
};
