import { AppError } from "../../shared/errors/AppError";
import { MfaService } from "../ports/MfaService";
import { UserMfaRepository } from "../ports/UserMfaRepository";

export type SetupMfaOutput = {
  secretBase32: string;
  otpauthUrl: string;
};

export class SetupMfaUseCase {
  constructor(
    private userMfaRepository: UserMfaRepository,
    private mfaService: MfaService
  ) {}

  async execute(userId: string, label: string): Promise<SetupMfaOutput> {
    if (!userId) {
      throw new AppError("User not found.", 404);
    }

    const existing = await this.userMfaRepository.findByUserId(userId);
    if (existing?.enabled) {
      throw new AppError("MFA already enabled.", 400);
    }

    if (existing?.secretBase32) {
      return {
        secretBase32: existing.secretBase32,
        otpauthUrl: this.mfaService.buildOtpauthUrl(existing.secretBase32, label)
      };
    }

    const secret = this.mfaService.generateSecret(label);
    await this.userMfaRepository.upsert(userId, secret.base32, false);

    return {
      secretBase32: secret.base32,
      otpauthUrl: secret.otpauthUrl
    };
  }
}
