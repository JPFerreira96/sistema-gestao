import { EventController } from "../../presentation/http/controllers/EventController";
import { buildEventRoutes } from "../../presentation/http/routes/eventRoutes";
import { CreateEventUseCase } from "../../application/usecases/CreateEventUseCase";
import { DeleteEventUseCase } from "../../application/usecases/DeleteEventUseCase";
import { GetEventUseCase } from "../../application/usecases/GetEventUseCase";
import { ListEventsUseCase } from "../../application/usecases/ListEventsUseCase";
import { UpdateEventUseCase } from "../../application/usecases/UpdateEventUseCase";
import { container } from "../../shared/di/container";

export const buildEventModule = () => {
  const createEvent = new CreateEventUseCase(container.eventRepository, container.eventNotifier);
  const listEvents = new ListEventsUseCase(container.eventRepository);
  const getEvent = new GetEventUseCase(container.eventRepository);
  const updateEvent = new UpdateEventUseCase(container.eventRepository);
  const deleteEvent = new DeleteEventUseCase(container.eventRepository);

  const controller = new EventController(
    createEvent,
    listEvents,
    getEvent,
    updateEvent,
    deleteEvent
  );

  return buildEventRoutes(controller, container.tokenService, container.auditLogRepository);
};
