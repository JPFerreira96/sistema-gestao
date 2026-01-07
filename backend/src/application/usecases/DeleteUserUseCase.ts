import { AppError } from "../../shared/errors/AppError";
import { UserRepository } from "../ports/UserRepository";

export class DeleteUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found.", 404);
    }

    await this.userRepository.delete(id);
  }
}
