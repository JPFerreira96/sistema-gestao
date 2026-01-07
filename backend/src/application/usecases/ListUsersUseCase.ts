import { User } from "../../domain/entities/User";
import { UserRepository } from "../ports/UserRepository";

export class ListUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.list();
  }
}
