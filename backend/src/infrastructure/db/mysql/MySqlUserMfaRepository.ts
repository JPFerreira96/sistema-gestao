import { UserMfa } from "../../../domain/entities/UserMfa";
import { UserMfaRepository } from "../../../application/ports/UserMfaRepository";
import { query } from "./DbConnection";

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const mapMfa = (row: any): UserMfa => ({
  userId: row.user_id,
  secretBase32: row.secret_base32,
  enabled: row.enabled === 1,
  createdAt: normalizeDateTime(row.created_at),
  updatedAt: normalizeDateTime(row.updated_at)
});

export class MySqlUserMfaRepository implements UserMfaRepository {
  async findByUserId(userId: string): Promise<UserMfa | null> {
    const rows = await query<any[]>("SELECT * FROM user_mfa WHERE user_id = ?", [userId]);
    if (!rows.length) {
      return null;
    }
    return mapMfa(rows[0]);
  }

  async upsert(userId: string, secretBase32: string, enabled: boolean): Promise<void> {
    await query(
      "INSERT INTO user_mfa (user_id, secret_base32, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE secret_base32 = VALUES(secret_base32), enabled = VALUES(enabled), updated_at = VALUES(updated_at)",
      [userId, secretBase32, enabled ? 1 : 0, new Date(), new Date()]
    );
  }

  async disable(userId: string): Promise<void> {
    await query("UPDATE user_mfa SET enabled = 0, updated_at = ? WHERE user_id = ?", [
      new Date(),
      userId
    ]);
  }
}
