import { UserMfaRepository } from "../ports/UserMfaRepository";

export class DisableMfaUseCase {
  constructor(private userMfaRepository: UserMfaRepository) {}

  async execute(userId: string): Promise<void> {
    await this.userMfaRepository.disable(userId);
  }
}
