import { createHash, randomBytes } from "crypto";
import { RefreshTokenService } from "../../application/ports/RefreshTokenService";
import { env } from "../../shared/config/env";

export class DefaultRefreshTokenService implements RefreshTokenService {
  generate(): string {
    return randomBytes(32).toString("hex");
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  buildExpirationDate(): Date {
    const now = new Date();
    now.setDate(now.getDate() + env.security.refreshTokenDays);
    return now;
  }
}
