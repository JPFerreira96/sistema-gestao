export type TokenPayload = {
  userId: string;
  permissionLevel: string;
  mfaVerified?: boolean;
};

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
