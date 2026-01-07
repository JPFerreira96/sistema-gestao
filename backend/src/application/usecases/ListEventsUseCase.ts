import { Event } from "../../domain/entities/Event";
import { EventFilters, EventRepository } from "../ports/EventRepository";

export class ListEventsUseCase {
  constructor(private eventRepository: EventRepository) {}

  async execute(filters?: EventFilters): Promise<Event[]> {
    return this.eventRepository.list(filters);
  }
}
