import { randomUUID } from "crypto";
import { AuditLogInput, AuditLogRepository } from "../../../application/ports/AuditLogRepository";
import { query } from "./DbConnection";

export class MySqlAuditLogRepository implements AuditLogRepository {
  async log(entry: AuditLogInput): Promise<void> {
    await query(
      "INSERT INTO audit_logs (id, user_id, action, ip, user_agent, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        randomUUID(),
        entry.userId,
        entry.action,
        entry.ip,
        entry.userAgent,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        new Date()
      ]
    );
  }
}
