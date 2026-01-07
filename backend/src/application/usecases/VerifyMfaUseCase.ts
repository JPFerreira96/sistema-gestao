import { AppError } from "../../shared/errors/AppError";
import { MfaService } from "../ports/MfaService";
import { UserMfaRepository } from "../ports/UserMfaRepository";

export class VerifyMfaUseCase {
  constructor(
    private userMfaRepository: UserMfaRepository,
    private mfaService: MfaService
  ) {}

  async execute(userId: string, token: string): Promise<void> {
    const mfa = await this.userMfaRepository.findByUserId(userId);
    if (!mfa) {
      throw new AppError("MFA not setup.", 400);
    }

    const ok = this.mfaService.verify(mfa.secretBase32, token);
    if (!ok) {
      throw new AppError("Invalid MFA token.", 400);
    }

    await this.userMfaRepository.upsert(userId, mfa.secretBase32, true);
  }
}
