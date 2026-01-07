export interface RefreshTokenService {
  generate(): string;
  hash(token: string): string;
  buildExpirationDate(): Date;
}
