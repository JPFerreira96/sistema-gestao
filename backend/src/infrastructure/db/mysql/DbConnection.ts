import mysql from "mysql2/promise";
import { env } from "../../../shared/config/env";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  connectionLimit: 10
});

export async function query<T>(
  sql: string,
  params?: Array<string | number | boolean | null | Date>
) {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
