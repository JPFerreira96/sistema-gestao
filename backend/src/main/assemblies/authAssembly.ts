import { AuthController } from "../../presentation/http/controllers/AuthController";
import { buildAuthRoutes } from "../../presentation/http/routes/authRoutes";
import { CreateCredentialsUseCase } from "../../application/usecases/CreateCredentialsUseCase";
import { LoginUseCase } from "../../application/usecases/LoginUseCase";
import { RefreshSessionUseCase } from "../../application/usecases/RefreshSessionUseCase";
import { LogoutUseCase } from "../../application/usecases/LogoutUseCase";
import { SetupMfaUseCase } from "../../application/usecases/SetupMfaUseCase";
import { VerifyMfaUseCase } from "../../application/usecases/VerifyMfaUseCase";
import { DisableMfaUseCase } from "../../application/usecases/DisableMfaUseCase";
import { container } from "../../shared/di/container";
import { env } from "../../shared/config/env";

export const buildAuthModule = () => {
  const login = new LoginUseCase(
    container.credentialRepository,
    container.userRepository,
    container.hasher,
    container.tokenService,
    container.refreshTokenRepository,
    container.refreshTokenService,
    container.userMfaRepository,
    container.mfaService,
    env.security.maxLoginAttempts,
    env.security.lockoutMinutes
  );

  const refreshSession = new RefreshSessionUseCase(
    container.refreshTokenRepository,
    container.refreshTokenService,
    container.userRepository,
    container.tokenService
  );

  const logout = new LogoutUseCase(
    container.refreshTokenRepository,
    container.refreshTokenService
  );

  const createCredentials = new CreateCredentialsUseCase(
    container.userRepository,
    container.credentialRepository,
    container.hasher
  );

  const setupMfa = new SetupMfaUseCase(container.userMfaRepository, container.mfaService);
  const verifyMfa = new VerifyMfaUseCase(container.userMfaRepository, container.mfaService);
  const disableMfa = new DisableMfaUseCase(container.userMfaRepository);

  const controller = new AuthController(
    login,
    refreshSession,
    logout,
    createCredentials,
    setupMfa,
    verifyMfa,
    disableMfa,
    container.userMfaRepository,
    container.tokenService,
    container.refreshTokenService,
    container.refreshTokenRepository
  );

  return buildAuthRoutes(controller, container.tokenService, container.auditLogRepository);
};
