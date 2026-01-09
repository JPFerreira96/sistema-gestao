import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { CreateCredentialsUseCase } from "../../../application/usecases/CreateCredentialsUseCase";
import { DisableMfaUseCase } from "../../../application/usecases/DisableMfaUseCase";
import { LoginUseCase } from "../../../application/usecases/LoginUseCase";
import { RefreshSessionUseCase } from "../../../application/usecases/RefreshSessionUseCase";
import { SetupMfaUseCase } from "../../../application/usecases/SetupMfaUseCase";
import { VerifyMfaUseCase } from "../../../application/usecases/VerifyMfaUseCase";
import { LogoutUseCase } from "../../../application/usecases/LogoutUseCase";
import { UserMfaRepository } from "../../../application/ports/UserMfaRepository";
import { RefreshTokenRepository } from "../../../application/ports/RefreshTokenRepository";
import { RefreshTokenService } from "../../../application/ports/RefreshTokenService";
import { TokenService } from "../../../application/ports/TokenService";
import { env } from "../../../shared/config/env";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  createCredentialsSchema,
  loginSchema,
  mfaSetupSchema,
  mfaVerifySchema
} from "../validators/schemas";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const CSRF_COOKIE = "csrf_token";

const buildCookieOptions = (httpOnly: boolean, maxAge: number) => ({
  httpOnly,
  maxAge,
  secure: env.cookies.secure,
  sameSite: env.cookies.sameSite,
  domain: env.cookies.domain || undefined,
  path: "/"
});

const createCsrfToken = () => randomBytes(32).toString("hex");

export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private refreshSessionUseCase: RefreshSessionUseCase,
    private logoutUseCase: LogoutUseCase,
    private createCredentialsUseCase: CreateCredentialsUseCase,
    private setupMfaUseCase: SetupMfaUseCase,
    private verifyMfaUseCase: VerifyMfaUseCase,
    private disableMfaUseCase: DisableMfaUseCase,
    private userMfaRepository: UserMfaRepository,
    private tokenService: TokenService,
    private refreshTokenService: RefreshTokenService,
    private refreshTokenRepository: RefreshTokenRepository
  ) {}

  login = async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    const result = await this.loginUseCase.execute(payload);

    const csrfToken = createCsrfToken();
    if (result.accessToken) {
      res.cookie(ACCESS_COOKIE, result.accessToken, buildCookieOptions(true, env.jwt.accessTokenMs));
    }
    if (!result.mfaRequired && result.refreshToken) {
      res.cookie(
        REFRESH_COOKIE,
        result.refreshToken,
        buildCookieOptions(true, env.security.refreshTokenDays * 24 * 60 * 60 * 1000)
      );
    }
    res.cookie(CSRF_COOKIE, csrfToken, buildCookieOptions(false, env.jwt.accessTokenMs));

    if (result.mfaRequired) {
      return res.json({
        userId: result.userId,
        permissionLevel: result.permissionLevel,
        mfaEnabled: result.mfaEnabled,
        mfaRequired: true
      });
    }

    return res.json({
      userId: result.userId,
      permissionLevel: result.permissionLevel,
      csrfToken,
      mfaEnabled: result.mfaEnabled,
      mfaRequired: false
    });
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      return res.status(401).json({ error: "Missing refresh token." });
    }

    const result = await this.refreshSessionUseCase.execute(refreshToken);
    const mfa = await this.userMfaRepository.findByUserId(result.userId);
    const csrfToken = createCsrfToken();

    res.cookie(ACCESS_COOKIE, result.accessToken, buildCookieOptions(true, env.jwt.accessTokenMs));
    res.cookie(
      REFRESH_COOKIE,
      result.refreshToken,
      buildCookieOptions(true, env.security.refreshTokenDays * 24 * 60 * 60 * 1000)
    );
    res.cookie(CSRF_COOKIE, csrfToken, buildCookieOptions(false, env.jwt.accessTokenMs));

    return res.json({
      userId: result.userId,
      permissionLevel: result.permissionLevel,
      csrfToken,
      mfaEnabled: mfa?.enabled ?? false,
      mfaVerified: true
    });
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }

    res.clearCookie(ACCESS_COOKIE, buildCookieOptions(true, 0));
    res.clearCookie(REFRESH_COOKIE, buildCookieOptions(true, 0));
    res.clearCookie(CSRF_COOKIE, buildCookieOptions(false, 0));

    return res.status(204).send();
  };

  me = async (req: AuthRequest, res: Response) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const mfa = await this.userMfaRepository.findByUserId(req.auth.userId);
    return res.json({
      userId: req.auth.userId,
      permissionLevel: req.auth.permissionLevel,
      mfaEnabled: mfa?.enabled ?? false,
      mfaVerified: req.auth.mfaVerified ?? true
    });
  };

  createCredentials = async (req: Request, res: Response) => {
    const payload = createCredentialsSchema.parse(req.body);
    await this.createCredentialsUseCase.execute(payload);
    return res.status(201).send();
  };

  setupMfa = async (req: AuthRequest, res: Response) => {
    const payload = mfaSetupSchema.parse(req.body ?? {});
    if (!req.auth?.userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const label = payload.label ?? `Sistema Gestao (${req.auth.userId})`;
    const result = await this.setupMfaUseCase.execute(req.auth.userId, label);
    return res.json(result);
  };

  verifyMfa = async (req: AuthRequest, res: Response) => {
    const payload = mfaVerifySchema.parse(req.body);
    if (!req.auth?.userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    await this.verifyMfaUseCase.execute(req.auth.userId, payload.token);
    const accessToken = this.tokenService.sign({
      userId: req.auth.userId,
      permissionLevel: req.auth.permissionLevel,
      mfaVerified: true
    });
    const refreshToken = this.refreshTokenService.generate();
    const refreshTokenHash = this.refreshTokenService.hash(refreshToken);
    const expiresAt = this.refreshTokenService.buildExpirationDate();
    await this.refreshTokenRepository.create(req.auth.userId, refreshTokenHash, expiresAt);

    const csrfToken = createCsrfToken();
    res.cookie(ACCESS_COOKIE, accessToken, buildCookieOptions(true, env.jwt.accessTokenMs));
    res.cookie(
      REFRESH_COOKIE,
      refreshToken,
      buildCookieOptions(true, env.security.refreshTokenDays * 24 * 60 * 60 * 1000)
    );
    res.cookie(CSRF_COOKIE, csrfToken, buildCookieOptions(false, env.jwt.accessTokenMs));

    return res.json({
      userId: req.auth.userId,
      permissionLevel: req.auth.permissionLevel,
      csrfToken,
      mfaEnabled: true
    });
  };

  disableMfa = async (req: AuthRequest, res: Response) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    await this.disableMfaUseCase.execute(req.auth.userId);
    return res.status(204).send();
  };
}
