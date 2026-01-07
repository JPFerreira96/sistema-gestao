import { AppError } from "../../shared/errors/AppError";
import { Event } from "../../domain/entities/Event";
import { CreateEventInput, EventRepository } from "../ports/EventRepository";
import { EventNotifier } from "../ports/EventNotifier";

export class CreateEventUseCase {
  constructor(
    private eventRepository: EventRepository,
    private notifier: EventNotifier
  ) {}

  async execute(input: CreateEventInput): Promise<Event> {
    const start = Date.parse(input.startAt);
    const end = Date.parse(input.endAt);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new AppError("Invalid event date.");
    }

    if (start >= end) {
      throw new AppError("Start date must be before end date.");
    }

    const event = await this.eventRepository.create(input);

    try {
      await this.notifier.eventCreated(event);
    } catch (err) {
      console.warn("Failed to notify event creation.");
    }

    return event;
  }
}
