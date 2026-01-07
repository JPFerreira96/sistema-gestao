import { RefreshToken } from "../../domain/entities/RefreshToken";

export interface RefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken>;
  findValid(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string, replacedBy?: string | null): Promise<void>;
}
