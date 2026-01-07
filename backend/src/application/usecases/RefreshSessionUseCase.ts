import { AppError } from "../../shared/errors/AppError";
import { RefreshTokenRepository } from "../ports/RefreshTokenRepository";
import { RefreshTokenService } from "../ports/RefreshTokenService";
import { TokenService } from "../ports/TokenService";
import { UserRepository } from "../ports/UserRepository";

export type RefreshOutput = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  permissionLevel: string;
};

export class RefreshSessionUseCase {
  constructor(
    private refreshTokenRepository: RefreshTokenRepository,
    private refreshTokenService: RefreshTokenService,
    private userRepository: UserRepository,
    private tokenService: TokenService
  ) {}

  async execute(token: string): Promise<RefreshOutput> {
    const tokenHash = this.refreshTokenService.hash(token);
    const stored = await this.refreshTokenRepository.findValid(tokenHash);

    if (!stored) {
      throw new AppError("Invalid refresh token.", 401);
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const newRefreshToken = this.refreshTokenService.generate();
    const newHash = this.refreshTokenService.hash(newRefreshToken);
    const expiresAt = this.refreshTokenService.buildExpirationDate();

    const created = await this.refreshTokenRepository.create(user.id, newHash, expiresAt);
    await this.refreshTokenRepository.revoke(stored.id, created.id);

    const accessToken = this.tokenService.sign({
      userId: user.id,
      permissionLevel: user.permissionLevel
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      userId: user.id,
      permissionLevel: user.permissionLevel
    };
  }
}
