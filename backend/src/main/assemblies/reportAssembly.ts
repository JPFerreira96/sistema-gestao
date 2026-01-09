import { ReportController } from "../../presentation/http/controllers/ReportController";
import { buildReportRoutes } from "../../presentation/http/routes/reportRoutes";
import { GetAttendanceReportUseCase } from "../../application/usecases/GetAttendanceReportUseCase";
import { container } from "../../shared/di/container";

export const buildReportModule = () => {
  const attendanceReport = new GetAttendanceReportUseCase(container.reportRepository);
  const controller = new ReportController(attendanceReport);
  return buildReportRoutes(controller, container.tokenService, container.auditLogRepository);
};
