import { UserCredential } from "../../../domain/entities/UserCredential";
import { CredentialRepository } from "../../../application/ports/CredentialRepository";
import { query } from "./DbConnection";

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const mapCredential = (row: any): UserCredential => ({
  userId: row.user_id,
  email: row.email,
  passwordHash: row.password_hash,
  createdAt: normalizeDateTime(row.created_at)
});

export class MySqlCredentialRepository implements CredentialRepository {
  async create(userId: string, email: string, passwordHash: string): Promise<void> {
    await query(
      "INSERT INTO user_credentials (user_id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
      [userId, email, passwordHash, new Date()]
    );
  }

  async findByEmail(email: string): Promise<UserCredential | null> {
    const rows = await query<any[]>("SELECT * FROM user_credentials WHERE email = ?", [email]);
    if (!rows.length) {
      return null;
    }
    return mapCredential(rows[0]);
  }

  async findByUserId(userId: string): Promise<UserCredential | null> {
    const rows = await query<any[]>("SELECT * FROM user_credentials WHERE user_id = ?", [userId]);
    if (!rows.length) {
      return null;
    }
    return mapCredential(rows[0]);
  }
}
