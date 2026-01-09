import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { requireAuth, requirePermission } from "../middlewares/authMiddleware";
import { TokenService } from "../../../application/ports/TokenService";
import { AuditLogRepository } from "../../../application/ports/AuditLogRepository";
import { auditLogger } from "../middlewares/auditMiddleware";

export const buildReportRoutes = (
  controller: ReportController,
  tokenService: TokenService,
  auditLogRepository: AuditLogRepository
) => {
  const router = Router();
  const auth = requireAuth(tokenService);

  router.use(auth);
  router.use(auditLogger(auditLogRepository, "REPORTS"));

  router.get(
    "/events-attendance",
    requirePermission(["ALTO-COMANDO", "COMANDO", "ADMIN"]),
    controller.eventsAttendance
  );

  return router;
};
