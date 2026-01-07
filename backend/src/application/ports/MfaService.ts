export type MfaSecret = {
  base32: string;
  otpauthUrl: string;
};

export interface MfaService {
  generateSecret(label: string): MfaSecret;
  buildOtpauthUrl(secretBase32: string, label: string): string;
  verify(secretBase32: string, token: string): boolean;
}
