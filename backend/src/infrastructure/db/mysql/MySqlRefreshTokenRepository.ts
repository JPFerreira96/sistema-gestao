import { randomUUID } from "crypto";
import { RefreshToken } from "../../../domain/entities/RefreshToken";
import { RefreshTokenRepository } from "../../../application/ports/RefreshTokenRepository";
import { query } from "./DbConnection";

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const mapToken = (row: any): RefreshToken => ({
  id: row.id,
  userId: row.user_id,
  tokenHash: row.token_hash,
  expiresAt: normalizeDateTime(row.expires_at),
  createdAt: normalizeDateTime(row.created_at),
  revokedAt: normalizeDateTime(row.revoked_at),
  replacedBy: row.replaced_by
});

export class MySqlRefreshTokenRepository implements RefreshTokenRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    const id = randomUUID();
    const now = new Date();

    await query(
      "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, userId, tokenHash, expiresAt, now]
    );

    const rows = await query<any[]>("SELECT * FROM refresh_tokens WHERE id = ?", [id]);
    if (!rows.length) {
      throw new Error("Failed to create refresh token.");
    }

    return mapToken(rows[0]);
  }

  async findValid(tokenHash: string): Promise<RefreshToken | null> {
    const rows = await query<any[]>(
      "SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()",
      [tokenHash]
    );
    if (!rows.length) {
      return null;
    }
    return mapToken(rows[0]);
  }

  async revoke(id: string, replacedBy?: string | null): Promise<void> {
    await query(
      "UPDATE refresh_tokens SET revoked_at = ?, replaced_by = ? WHERE id = ?",
      [new Date(), replacedBy ?? null, id]
    );
  }
}
