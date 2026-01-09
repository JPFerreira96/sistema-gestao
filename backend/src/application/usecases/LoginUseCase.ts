import { AppError } from "../../shared/errors/AppError";
import { CredentialRepository } from "../ports/CredentialRepository";
import { PasswordHasher } from "../ports/PasswordHasher";
import { RefreshTokenRepository } from "../ports/RefreshTokenRepository";
import { RefreshTokenService } from "../ports/RefreshTokenService";
import { TokenService } from "../ports/TokenService";
import { UserMfaRepository } from "../ports/UserMfaRepository";
import { MfaService } from "../ports/MfaService";
import { UserRepository } from "../ports/UserRepository";

export type LoginInput = {
  email: string;
  password: string;
  mfaCode?: string;
};

export type LoginOutput = {
  accessToken?: string;
  refreshToken?: string;
  userId: string;
  permissionLevel: string;
  mfaEnabled: boolean;
  mfaRequired: boolean;
};

export class LoginUseCase {
  constructor(
    private credentialRepository: CredentialRepository,
    private userRepository: UserRepository,
    private hasher: PasswordHasher,
    private tokenService: TokenService,
    private refreshTokenRepository: RefreshTokenRepository,
    private refreshTokenService: RefreshTokenService,
    private userMfaRepository: UserMfaRepository,
    private mfaService: MfaService,
    private maxLoginAttempts: number,
    private lockoutMinutes: number
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const credentials = await this.credentialRepository.findByEmail(input.email);
    if (!credentials) {
      throw new AppError("Invalid credentials.", 401);
    }

    const user = await this.userRepository.findById(credentials.userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const now = new Date();
    if (user.lockoutUntil && new Date(user.lockoutUntil) > now) {
      throw new AppError("Account locked. Try again later.", 429);
    }

    const passwordMatch = await this.hasher.compare(input.password, credentials.passwordHash);
    if (!passwordMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const lockoutUntil =
        attempts >= this.maxLoginAttempts
          ? new Date(now.getTime() + this.lockoutMinutes * 60 * 1000)
          : null;
      await this.userRepository.recordLoginFailure(user.id, attempts, lockoutUntil);
      throw new AppError("Invalid credentials.", 401);
    }

    const mfa = await this.userMfaRepository.findByUserId(user.id);
    const mfaEnabled = mfa?.enabled ?? false;
    if (mfaEnabled) {
      if (!input.mfaCode) {
        const accessToken = this.tokenService.sign({
          userId: user.id,
          permissionLevel: user.permissionLevel,
          mfaVerified: false
        });
        return {
          accessToken,
          userId: user.id,
          permissionLevel: user.permissionLevel,
          mfaEnabled,
          mfaRequired: true
        };
      }
      if (!mfa?.secretBase32) {
        throw new AppError("MFA not configured.", 400);
      }
      const ok = this.mfaService.verify(mfa.secretBase32, input.mfaCode);
      if (!ok) {
        const attempts = user.failedLoginAttempts + 1;
        const lockoutUntil =
          attempts >= this.maxLoginAttempts
            ? new Date(now.getTime() + this.lockoutMinutes * 60 * 1000)
            : null;
        await this.userRepository.recordLoginFailure(user.id, attempts, lockoutUntil);
        throw new AppError("Invalid credentials.", 401);
      }
    }

    await this.userRepository.resetLoginFailures(user.id);

    const accessToken = this.tokenService.sign({
      userId: user.id,
      permissionLevel: user.permissionLevel,
      mfaVerified: true
    });

    const refreshToken = this.refreshTokenService.generate();
    const refreshTokenHash = this.refreshTokenService.hash(refreshToken);
    const expiresAt = this.refreshTokenService.buildExpirationDate();
    await this.refreshTokenRepository.create(user.id, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      permissionLevel: user.permissionLevel,
      mfaEnabled,
      mfaRequired: false
    };
  }
}
