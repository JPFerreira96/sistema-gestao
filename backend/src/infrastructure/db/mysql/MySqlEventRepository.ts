import { randomUUID } from "crypto";
import { Event } from "../../../domain/entities/Event";
import {
  CreateEventInput,
  EventFilters,
  EventRepository,
  UpdateEventInput
} from "../../../application/ports/EventRepository";
import { query } from "./DbConnection";

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const toDbDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const mapEvent = (row: any): Event => ({
  id: row.id,
  title: row.title,
  description: row.description,
  location: row.location,
  startAt: normalizeDateTime(row.start_at),
  endAt: normalizeDateTime(row.end_at),
  createdBy: row.created_by,
  createdAt: normalizeDateTime(row.created_at),
  updatedAt: normalizeDateTime(row.updated_at)
});

export class MySqlEventRepository implements EventRepository {
  async create(input: CreateEventInput): Promise<Event> {
    const id = randomUUID();
    const now = new Date();

    await query(
      `INSERT INTO events (
        id,
        title,
        description,
        location,
        start_at,
        end_at,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.title,
        input.description,
        input.location,
        toDbDateTime(input.startAt),
        toDbDateTime(input.endAt),
        input.createdBy,
        now,
        now
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to create event.");
    }

    return created;
  }

  async list(filters?: EventFilters): Promise<Event[]> {
    let sql = "SELECT * FROM events";
    const conditions: string[] = [];
    const params: Array<string> = [];

    if (filters?.start && filters?.end) {
      conditions.push("start_at <= ? AND end_at >= ?");
      params.push(toDbDateTime(filters.end), toDbDateTime(filters.start));
    } else if (filters?.start) {
      conditions.push("end_at >= ?");
      params.push(toDbDateTime(filters.start));
    } else if (filters?.end) {
      conditions.push("start_at <= ?");
      params.push(toDbDateTime(filters.end));
    }

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += " ORDER BY start_at ASC";

    const rows = await query<any[]>(sql, params);
    return rows.map(mapEvent);
  }

  async findById(id: string): Promise<Event | null> {
    const rows = await query<any[]>("SELECT * FROM events WHERE id = ?", [id]);
    if (!rows.length) {
      return null;
    }
    return mapEvent(rows[0]);
  }

  async update(id: string, input: UpdateEventInput): Promise<Event> {
    const fields: string[] = [];
    const values: Array<string | null | Date> = [];

    const pushField = (column: string, value: string | null | Date) => {
      fields.push(`${column} = ?`);
      values.push(value);
    };

    if (input.title !== undefined) pushField("title", input.title);
    if (input.description !== undefined) pushField("description", input.description);
    if (input.location !== undefined) pushField("location", input.location);
    if (input.startAt !== undefined) pushField("start_at", toDbDateTime(input.startAt));
    if (input.endAt !== undefined) pushField("end_at", toDbDateTime(input.endAt));

    pushField("updated_at", new Date());

    await query(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to update event.");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await query("DELETE FROM events WHERE id = ?", [id]);
  }
}
