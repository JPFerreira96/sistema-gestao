import speakeasy from "speakeasy";
import { MfaSecret, MfaService } from "../../application/ports/MfaService";

export class SpeakeasyMfaService implements MfaService {
  generateSecret(label: string): MfaSecret {
    const secret = speakeasy.generateSecret({ name: label });
    return {
      base32: secret.base32,
      otpauthUrl: secret.otpauth_url ?? ""
    };
  }

  buildOtpauthUrl(secretBase32: string, label: string): string {
    return speakeasy.otpauthURL({
      secret: secretBase32,
      label,
      encoding: "base32"
    });
  }

  verify(secretBase32: string, token: string): boolean {
    const normalized = token.replace(/\D/g, "");
    return speakeasy.totp.verify({
      secret: secretBase32,
      encoding: "base32",
      token: normalized,
      window: 6
    });
  }
}
