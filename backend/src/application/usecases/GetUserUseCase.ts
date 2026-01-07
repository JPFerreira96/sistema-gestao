import { User } from "../../domain/entities/User";
import { AppError } from "../../shared/errors/AppError";
import { UserRepository } from "../ports/UserRepository";

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return user;
  }
}
