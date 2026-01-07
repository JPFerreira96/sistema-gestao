export type TokenPayload = {
  userId: string;
  permissionLevel: string;
};

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
