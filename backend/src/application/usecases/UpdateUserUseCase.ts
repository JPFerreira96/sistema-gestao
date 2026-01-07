import { User } from "../../domain/entities/User";
import { AppError } from "../../shared/errors/AppError";
import { UpdateUserInput, UserRepository } from "../ports/UserRepository";

export class UpdateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    if (input.hasAllergy === true && !input.allergyDetails) {
      throw new AppError("Allergy details required when hasAllergy is true.");
    }

    if (input.hasAllergy === false) {
      input.allergyDetails = null;
    }

    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found.", 404);
    }

    return this.userRepository.update(id, input);
  }
}
