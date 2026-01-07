import { MySqlUserRepository } from "../../infrastructure/db/mysql/MySqlUserRepository";
import { MySqlCredentialRepository } from "../../infrastructure/db/mysql/MySqlCredentialRepository";
import { MySqlEventRepository } from "../../infrastructure/db/mysql/MySqlEventRepository";
import { MySqlRefreshTokenRepository } from "../../infrastructure/db/mysql/MySqlRefreshTokenRepository";
import { MySqlAuditLogRepository } from "../../infrastructure/db/mysql/MySqlAuditLogRepository";
import { MySqlUserMfaRepository } from "../../infrastructure/db/mysql/MySqlUserMfaRepository";
import { BcryptHasher } from "../../infrastructure/security/BcryptHasher";
import { JwtTokenService } from "../../infrastructure/security/JwtTokenService";
import { DefaultRefreshTokenService } from "../../infrastructure/security/DefaultRefreshTokenService";
import { SpeakeasyMfaService } from "../../infrastructure/security/SpeakeasyMfaService";
import { ConsoleEventNotifier } from "../../infrastructure/notifications/ConsoleEventNotifier";

export const container = {
  userRepository: new MySqlUserRepository(),
  credentialRepository: new MySqlCredentialRepository(),
  eventRepository: new MySqlEventRepository(),
  refreshTokenRepository: new MySqlRefreshTokenRepository(),
  auditLogRepository: new MySqlAuditLogRepository(),
  userMfaRepository: new MySqlUserMfaRepository(),
  hasher: new BcryptHasher(),
  tokenService: new JwtTokenService(),
  refreshTokenService: new DefaultRefreshTokenService(),
  mfaService: new SpeakeasyMfaService(),
  eventNotifier: new ConsoleEventNotifier()
};
