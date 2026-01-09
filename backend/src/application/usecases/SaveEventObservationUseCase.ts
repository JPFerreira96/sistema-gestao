import { AppError } from "../../shared/errors/AppError";
import { EventObservationRepository } from "../ports/EventObservationRepository";
import { EventRepository } from "../ports/EventRepository";

export class SaveEventObservationUseCase {
  constructor(
    private eventRepository: EventRepository,
    private observationRepository: EventObservationRepository
  ) {}

  async execute(eventId: string, note: string, createdBy: string): Promise<void> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    await this.observationRepository.upsertGeneral(eventId, note, createdBy);
  }
}
