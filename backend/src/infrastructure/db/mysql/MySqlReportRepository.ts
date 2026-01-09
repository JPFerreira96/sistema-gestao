import {
  AttendanceReport,
  AttendanceReportFilters,
  EventAttendanceSummary,
  OperatorAttendanceSummary,
  ReportRepository
} from "../../../application/ports/ReportRepository";
import { query } from "./DbConnection";

export class MySqlReportRepository implements ReportRepository {
  async getAttendanceReport(filters: AttendanceReportFilters): Promise<AttendanceReport> {
    const params: Array<string> = [filters.start, filters.end];
    let eventClause = "";
    if (filters.eventId) {
      eventClause = "AND e.id = ?";
      params.push(filters.eventId);
    }

    const events = await query<EventAttendanceSummary[]>(
      `
      SELECT
        e.id AS eventId,
        e.title AS title,
        e.start_at AS startAt,
        e.end_at AS endAt,
        COUNT(DISTINCT a.user_id) AS totalAssigned,
        COALESCE(SUM(CASE WHEN att.present = 1 THEN 1 ELSE 0 END), 0) AS presentCount
      FROM events e
      LEFT JOIN event_assignments a ON a.event_id = e.id
      LEFT JOIN event_attendance att
        ON att.event_id = e.id AND att.user_id = a.user_id
      WHERE e.start_at >= ? AND e.end_at <= ?
      ${eventClause}
      GROUP BY e.id
      ORDER BY e.start_at DESC
      `,
      params
    );

    const operatorParams: Array<string> = [filters.start, filters.end];
    let operatorEventClause = "";
    if (filters.eventId) {
      operatorEventClause = "AND e.id = ?";
      operatorParams.push(filters.eventId);
    }

    const operators = await query<OperatorAttendanceSummary[]>(
      `
      SELECT
        u.id AS userId,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        COUNT(DISTINCT ea.event_id) AS totalAssigned,
        COALESCE(SUM(CASE WHEN att.present = 1 THEN 1 ELSE 0 END), 0) AS presentCount
      FROM users u
      LEFT JOIN (
        SELECT a.user_id, a.event_id
        FROM event_assignments a
        JOIN events e ON e.id = a.event_id
        WHERE e.start_at >= ? AND e.end_at <= ?
        ${operatorEventClause}
      ) ea ON ea.user_id = u.id
      LEFT JOIN event_attendance att
        ON att.event_id = ea.event_id AND att.user_id = u.id
      GROUP BY u.id
      ORDER BY totalAssigned DESC, presentCount DESC, name ASC
      `,
      operatorParams
    );

    return {
      filters,
      events,
      operators
    };
  }
}
