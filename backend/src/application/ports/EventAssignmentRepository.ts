import { EventAssignment } from "../../domain/entities/EventAssignment";

export interface EventAssignmentRepository {
  setAssignments(eventId: string, userIds: string[], assignedBy: string): Promise<void>;
  listByEvent(eventId: string): Promise<EventAssignment[]>;
}
