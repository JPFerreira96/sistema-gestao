import bcrypt from "bcryptjs";
import { PasswordHasher } from "../../application/ports/PasswordHasher";

export class BcryptHasher implements PasswordHasher {
  async hash(raw: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(raw, salt);
  }

  async compare(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }
}
