import { Event } from "../../domain/entities/Event";
import { EventNotifier } from "../../application/ports/EventNotifier";

export class ConsoleEventNotifier implements EventNotifier {
  async eventCreated(event: Event): Promise<void> {
    console.log(`Event created: ${event.title} (${event.startAt})`);
  }
}
