import jwt from "jsonwebtoken";
import { TokenPayload, TokenService } from "../../application/ports/TokenService";
import { env } from "../../shared/config/env";

export class JwtTokenService implements TokenService {
  sign(payload: TokenPayload): string {
    return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, env.jwt.secret) as TokenPayload;
    return decoded;
  }
}
