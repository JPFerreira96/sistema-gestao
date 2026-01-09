import { randomUUID } from "crypto";
import {
  AttendanceItemInput,
  EventAttendanceRepository
} from "../../../application/ports/EventAttendanceRepository";
import { EventAttendance } from "../../../domain/entities/EventAttendance";
import { query } from "./DbConnection";

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const mapAttendance = (row: any): EventAttendance => ({
  id: row.id,
  eventId: row.event_id,
  userId: row.user_id,
  present: row.present === 1,
  markedBy: row.marked_by,
  markedAt: normalizeDateTime(row.marked_at),
  createdAt: normalizeDateTime(row.created_at),
  updatedAt: normalizeDateTime(row.updated_at)
});

export class MySqlEventAttendanceRepository implements EventAttendanceRepository {
  async upsertBatch(
    eventId: string,
    items: AttendanceItemInput[],
    markedBy: string
  ): Promise<void> {
    if (!items.length) {
      return;
    }

    const now = new Date();
    const placeholders = items.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = items.flatMap((item) => [
      randomUUID(),
      eventId,
      item.userId,
      item.present ? 1 : 0,
      markedBy,
      now,
      now,
      now
    ]);

    await query(
      `INSERT INTO event_attendance (
        id, event_id, user_id, present, marked_by, marked_at, created_at, updated_at
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        present = VALUES(present),
        marked_by = VALUES(marked_by),
        marked_at = VALUES(marked_at),
        updated_at = VALUES(updated_at)`,
      values
    );
  }

  async listByEvent(eventId: string): Promise<EventAttendance[]> {
    const rows = await query<any[]>(
      "SELECT * FROM event_attendance WHERE event_id = ?",
      [eventId]
    );
    return rows.map(mapAttendance);
  }
}
