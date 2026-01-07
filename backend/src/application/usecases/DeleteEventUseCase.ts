import { AppError } from "../../shared/errors/AppError";
import { EventRepository } from "../ports/EventRepository";

export class DeleteEventUseCase {
  constructor(private eventRepository: EventRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found.", 404);
    }

    await this.eventRepository.delete(id);
  }
}
