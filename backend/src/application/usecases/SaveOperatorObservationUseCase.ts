import { AppError } from "../../shared/errors/AppError";
import { EventAssignmentRepository } from "../ports/EventAssignmentRepository";
import { EventObservationRepository } from "../ports/EventObservationRepository";
import { EventRepository } from "../ports/EventRepository";

export class SaveOperatorObservationUseCase {
  constructor(
    private eventRepository: EventRepository,
    private assignmentRepository: EventAssignmentRepository,
    private observationRepository: EventObservationRepository
  ) {}

  async execute(
    eventId: string,
    operatorId: string,
    note: string,
    createdBy: string
  ): Promise<void> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    const assignments = await this.assignmentRepository.listByEvent(eventId);
    const assigned = assignments.some((assignment) => assignment.userId === operatorId);
    if (!assigned) {
      throw new AppError("Operator not assigned to this event.", 400);
    }

    await this.observationRepository.upsertOperator(eventId, operatorId, note, createdBy);
  }
}
