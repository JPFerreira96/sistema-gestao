import { randomUUID } from "crypto";
import { EventObservationRepository } from "../../../application/ports/EventObservationRepository";
import { EventObservation } from "../../../domain/entities/EventObservation";
import { query } from "./DbConnection";

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const mapObservation = (row: any): EventObservation => ({
  id: row.id,
  eventId: row.event_id,
  operatorId: row.operator_id,
  note: row.note,
  createdBy: row.created_by,
  createdAt: normalizeDateTime(row.created_at),
  updatedAt: normalizeDateTime(row.updated_at)
});

export class MySqlEventObservationRepository implements EventObservationRepository {
  async upsertGeneral(eventId: string, note: string, createdBy: string): Promise<void> {
    await query(
      "DELETE FROM event_observations WHERE event_id = ? AND operator_id IS NULL",
      [eventId]
    );

    await query(
      `INSERT INTO event_observations (
        id, event_id, operator_id, note, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), eventId, null, note, createdBy, new Date(), new Date()]
    );
  }

  async upsertOperator(
    eventId: string,
    operatorId: string,
    note: string,
    createdBy: string
  ): Promise<void> {
    await query(
      `INSERT INTO event_observations (
        id, event_id, operator_id, note, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        note = VALUES(note),
        updated_at = VALUES(updated_at)`,
      [randomUUID(), eventId, operatorId, note, createdBy, new Date(), new Date()]
    );
  }

  async listByEvent(eventId: string): Promise<EventObservation[]> {
    const rows = await query<any[]>(
      "SELECT * FROM event_observations WHERE event_id = ?",
      [eventId]
    );
    return rows.map(mapObservation);
  }
}
