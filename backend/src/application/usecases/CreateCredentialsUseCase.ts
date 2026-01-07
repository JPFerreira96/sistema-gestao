import { AppError } from "../../shared/errors/AppError";
import { CredentialRepository } from "../ports/CredentialRepository";
import { PasswordHasher } from "../ports/PasswordHasher";
import { UserRepository } from "../ports/UserRepository";

export type CreateCredentialsInput = {
  userId: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export class CreateCredentialsUseCase {
  constructor(
    private userRepository: UserRepository,
    private credentialRepository: CredentialRepository,
    private hasher: PasswordHasher
  ) {}

  private validatePassword(password: string) {
    const rules = [
      { ok: password.length >= 8, message: "Password must be at least 8 characters." },
      { ok: /[A-Z]/.test(password), message: "Password must include an uppercase letter." },
      { ok: /[a-z]/.test(password), message: "Password must include a lowercase letter." },
      { ok: /[0-9]/.test(password), message: "Password must include a number." },
      { ok: /[^A-Za-z0-9]/.test(password), message: "Password must include a symbol." }
    ];

    const firstError = rules.find((rule) => !rule.ok);
    if (firstError) {
      throw new AppError(firstError.message);
    }
  }

  async execute(input: CreateCredentialsInput): Promise<void> {
    if (input.password !== input.confirmPassword) {
      throw new AppError("Passwords do not match.");
    }

    this.validatePassword(input.password);

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const existingByUser = await this.credentialRepository.findByUserId(input.userId);
    if (existingByUser) {
      throw new AppError("Credentials already exist for this user.");
    }

    const existingByEmail = await this.credentialRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new AppError("Email already in use.");
    }

    const passwordHash = await this.hasher.hash(input.password);
    await this.credentialRepository.create(input.userId, input.email, passwordHash);
  }
}
