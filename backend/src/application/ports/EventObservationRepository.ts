import { EventObservation } from "../../domain/entities/EventObservation";

export interface EventObservationRepository {
  upsertGeneral(eventId: string, note: string, createdBy: string): Promise<void>;
  upsertOperator(eventId: string, operatorId: string, note: string, createdBy: string): Promise<void>;
  listByEvent(eventId: string): Promise<EventObservation[]>;
}
