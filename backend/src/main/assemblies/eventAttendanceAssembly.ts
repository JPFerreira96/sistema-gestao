import { EventAttendanceController } from "../../presentation/http/controllers/EventAttendanceController";
import { buildEventAttendanceRoutes } from "../../presentation/http/routes/eventAttendanceRoutes";
import { GetEventAttendanceUseCase } from "../../application/usecases/GetEventAttendanceUseCase";
import { MarkEventAttendanceUseCase } from "../../application/usecases/MarkEventAttendanceUseCase";
import { SaveEventObservationUseCase } from "../../application/usecases/SaveEventObservationUseCase";
import { SaveOperatorObservationUseCase } from "../../application/usecases/SaveOperatorObservationUseCase";
import { SetEventAssignmentsUseCase } from "../../application/usecases/SetEventAssignmentsUseCase";
import { container } from "../../shared/di/container";

export const buildEventAttendanceModule = () => {
  const setAssignments = new SetEventAssignmentsUseCase(
    container.eventRepository,
    container.eventAssignmentRepository,
    container.userRepository
  );

  const markAttendance = new MarkEventAttendanceUseCase(
    container.eventRepository,
    container.eventAssignmentRepository,
    container.eventAttendanceRepository,
    container.eventObservationRepository
  );

  const getAttendance = new GetEventAttendanceUseCase(
    container.eventRepository,
    container.eventAssignmentRepository,
    container.eventAttendanceRepository,
    container.eventObservationRepository,
    container.userRepository
  );

  const saveGeneralObservation = new SaveEventObservationUseCase(
    container.eventRepository,
    container.eventObservationRepository
  );

  const saveOperatorObservation = new SaveOperatorObservationUseCase(
    container.eventRepository,
    container.eventAssignmentRepository,
    container.eventObservationRepository
  );

  const controller = new EventAttendanceController(
    setAssignments,
    markAttendance,
    getAttendance,
    saveGeneralObservation,
    saveOperatorObservation
  );

  return buildEventAttendanceRoutes(
    controller,
    container.tokenService,
    container.auditLogRepository
  );
};
