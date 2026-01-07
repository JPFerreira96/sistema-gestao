import { Event } from "../../domain/entities/Event";
import { AppError } from "../../shared/errors/AppError";
import { EventRepository, UpdateEventInput } from "../ports/EventRepository";

export class UpdateEventUseCase {
  constructor(private eventRepository: EventRepository) {}

  async execute(id: string, input: UpdateEventInput): Promise<Event> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found.", 404);
    }

    const startAt = input.startAt ?? existing.startAt;
    const endAt = input.endAt ?? existing.endAt;

    const start = Date.parse(startAt);
    const end = Date.parse(endAt);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new AppError("Invalid event date.");
    }

    if (start >= end) {
      throw new AppError("Start date must be before end date.");
    }

    return this.eventRepository.update(id, input);
  }
}
