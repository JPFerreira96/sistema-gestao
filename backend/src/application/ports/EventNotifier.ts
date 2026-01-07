import { Event } from "../../domain/entities/Event";

export interface EventNotifier {
  eventCreated(event: Event): Promise<void>;
}
