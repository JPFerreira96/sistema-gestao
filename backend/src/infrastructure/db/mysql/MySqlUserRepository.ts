import { randomUUID } from "crypto";
import { User } from "../../../domain/entities/User";
import { CreateUserInput, UpdateUserInput, UserRepository } from "../../../application/ports/UserRepository";
import { query } from "./DbConnection";

const normalizeDate = (value: any) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value;

const normalizeDateTime = (value: any) =>
  value instanceof Date ? value.toISOString() : value;

const mapUser = (row: any): User => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  motherName: row.mother_name,
  fatherName: row.father_name,
  combatClass: row.combat_class,
  birthDate: normalizeDate(row.birth_date),
  bloodType: row.blood_type,
  hasAllergy: row.has_allergy === 1,
  allergyDetails: row.allergy_details,
  phone: row.phone,
  emergencyPhone: row.emergency_phone,
  emergencyContactName: row.emergency_contact_name,
  permissionLevel: row.permission_level,
  failedLoginAttempts: row.failed_login_attempts ?? 0,
  lockoutUntil: normalizeDateTime(row.lockout_until),
  createdAt: normalizeDateTime(row.created_at),
  updatedAt: normalizeDateTime(row.updated_at)
});

export class MySqlUserRepository implements UserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const id = randomUUID();
    const now = new Date();

    await query(
      `INSERT INTO users (
        id,
        first_name,
        last_name,
        mother_name,
        father_name,
        combat_class,
        birth_date,
        blood_type,
        has_allergy,
        allergy_details,
        phone,
        emergency_phone,
        emergency_contact_name,
        permission_level,
        failed_login_attempts,
        lockout_until,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.firstName,
        input.lastName,
        input.motherName,
        input.fatherName,
        input.combatClass,
        input.birthDate,
        input.bloodType,
        input.hasAllergy ? 1 : 0,
        input.allergyDetails,
        input.phone,
        input.emergencyPhone,
        input.emergencyContactName,
        input.permissionLevel,
        0,
        null,
        now,
        now
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to create user.");
    }

    return created;
  }

  async list(): Promise<User[]> {
    const rows = await query<any[]>(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    return rows.map(mapUser);
  }

  async findById(id: string): Promise<User | null> {
    const rows = await query<any[]>("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows.length) {
      return null;
    }
    return mapUser(rows[0]);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids.length) {
      return [];
    }
    const placeholders = ids.map(() => "?").join(", ");
    const rows = await query<any[]>(
      `SELECT * FROM users WHERE id IN (${placeholders})`,
      ids
    );
    return rows.map(mapUser);
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const fields: string[] = [];
    const values: Array<string | number | boolean | null | Date> = [];

    const pushField = (column: string, value: string | number | boolean | null | Date) => {
      fields.push(`${column} = ?`);
      values.push(value);
    };

    if (input.firstName !== undefined) pushField("first_name", input.firstName);
    if (input.lastName !== undefined) pushField("last_name", input.lastName);
    if (input.motherName !== undefined) pushField("mother_name", input.motherName);
    if (input.fatherName !== undefined) pushField("father_name", input.fatherName);
    if (input.combatClass !== undefined) pushField("combat_class", input.combatClass);
    if (input.birthDate !== undefined) pushField("birth_date", input.birthDate);
    if (input.bloodType !== undefined) pushField("blood_type", input.bloodType);
    if (input.hasAllergy !== undefined) pushField("has_allergy", input.hasAllergy ? 1 : 0);
    if (input.allergyDetails !== undefined) pushField("allergy_details", input.allergyDetails);
    if (input.phone !== undefined) pushField("phone", input.phone);
    if (input.emergencyPhone !== undefined) pushField("emergency_phone", input.emergencyPhone);
    if (input.emergencyContactName !== undefined) pushField("emergency_contact_name", input.emergencyContactName);
    if (input.permissionLevel !== undefined) pushField("permission_level", input.permissionLevel);

    pushField("updated_at", new Date());

    await query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to update user.");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await query("DELETE FROM users WHERE id = ?", [id]);
  }

  async recordLoginFailure(
    userId: string,
    attempts: number,
    lockoutUntil: Date | null
  ): Promise<void> {
    await query(
      "UPDATE users SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?",
      [attempts, lockoutUntil, userId]
    );
  }

  async resetLoginFailures(userId: string): Promise<void> {
    await query(
      "UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?",
      [userId]
    );
  }
}
