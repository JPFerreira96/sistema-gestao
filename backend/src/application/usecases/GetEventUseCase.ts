import { Event } from "../../domain/entities/Event";
import { AppError } from "../../shared/errors/AppError";
import { EventRepository } from "../ports/EventRepository";

export class GetEventUseCase {
  constructor(private eventRepository: EventRepository) {}

  async execute(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    return event;
  }
}
