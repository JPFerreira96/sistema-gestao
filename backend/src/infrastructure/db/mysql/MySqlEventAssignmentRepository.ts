import { randomUUID } from "crypto";
import { EventAssignment } from "../../../domain/entities/EventAssignment";
import { EventAssignmentRepository } from "../../../application/ports/EventAssignmentRepository";
import { query } from "./DbConnection";

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const mapAssignment = (row: any): EventAssignment => ({
  id: row.id,
  eventId: row.event_id,
  userId: row.user_id,
  assignedBy: row.assigned_by,
  assignedAt: normalizeDateTime(row.assigned_at),
  createdAt: normalizeDateTime(row.created_at),
  updatedAt: normalizeDateTime(row.updated_at)
});

export class MySqlEventAssignmentRepository implements EventAssignmentRepository {
  async setAssignments(eventId: string, userIds: string[], assignedBy: string): Promise<void> {
    const existing = await query<any[]>(
      "SELECT user_id FROM event_assignments WHERE event_id = ?",
      [eventId]
    );
    const existingIds = new Set(existing.map((row) => row.user_id));
    const uniqueUserIds = Array.from(new Set(userIds));

    const toDelete = Array.from(existingIds).filter((id) => !uniqueUserIds.includes(id));
    if (toDelete.length) {
      const placeholders = toDelete.map(() => "?").join(", ");
      await query(
        `DELETE FROM event_assignments WHERE event_id = ? AND user_id IN (${placeholders})`,
        [eventId, ...toDelete]
      );
    }

    const toInsert = uniqueUserIds.filter((id) => !existingIds.has(id));
    if (toInsert.length) {
      const now = new Date();
      const placeholders = toInsert.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
      const values = toInsert.flatMap((userId) => [
        randomUUID(),
        eventId,
        userId,
        assignedBy,
        now,
        now,
        now
      ]);
      await query(
        `INSERT INTO event_assignments (
          id, event_id, user_id, assigned_by, assigned_at, created_at, updated_at
        ) VALUES ${placeholders}`,
        values
      );
    }
  }

  async listByEvent(eventId: string): Promise<EventAssignment[]> {
    const rows = await query<any[]>(
      "SELECT * FROM event_assignments WHERE event_id = ?",
      [eventId]
    );
    return rows.map(mapAssignment);
  }
}
