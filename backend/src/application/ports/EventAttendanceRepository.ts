import { EventAttendance } from "../../domain/entities/EventAttendance";

export type AttendanceItemInput = {
  userId: string;
  present: boolean;
};

export interface EventAttendanceRepository {
  upsertBatch(eventId: string, items: AttendanceItemInput[], markedBy: string): Promise<void>;
  listByEvent(eventId: string): Promise<EventAttendance[]>;
}
