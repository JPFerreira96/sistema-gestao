import { User } from "../../domain/entities/User";
import { AppError } from "../../shared/errors/AppError";
import { CreateUserInput, UserRepository } from "../ports/UserRepository";

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    if (input.hasAllergy && !input.allergyDetails) {
      throw new AppError("Allergy details required when hasAllergy is true.");
    }

    const normalized = {
      ...input,
      allergyDetails: input.hasAllergy ? input.allergyDetails : null
    };

    return this.userRepository.create(normalized);
  }
}
