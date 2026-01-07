import { UserCredential } from "../../domain/entities/UserCredential";

export interface CredentialRepository {
  create(userId: string, email: string, passwordHash: string): Promise<void>;
  findByEmail(email: string): Promise<UserCredential | null>;
  findByUserId(userId: string): Promise<UserCredential | null>;
}
