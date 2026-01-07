import { RefreshTokenRepository } from "../ports/RefreshTokenRepository";
import { RefreshTokenService } from "../ports/RefreshTokenService";

export class LogoutUseCase {
  constructor(
    private refreshTokenRepository: RefreshTokenRepository,
    private refreshTokenService: RefreshTokenService
  ) {}

  async execute(token: string): Promise<void> {
    const tokenHash = this.refreshTokenService.hash(token);
    const stored = await this.refreshTokenRepository.findValid(tokenHash);
    if (!stored) {
      return;
    }
    await this.refreshTokenRepository.revoke(stored.id, null);
  }
}
