import { UserMfa } from "../../domain/entities/UserMfa";

export interface UserMfaRepository {
  findByUserId(userId: string): Promise<UserMfa | null>;
  upsert(userId: string, secretBase32: string, enabled: boolean): Promise<void>;
  disable(userId: string): Promise<void>;
}
