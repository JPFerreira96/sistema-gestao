import { NextFunction, Request, Response } from "express";
import { TokenService } from "../../../application/ports/TokenService";
import { AppError } from "../../../shared/errors/AppError";

export type AuthRequest = Request & {
  auth?: {
    userId: string;
    permissionLevel: string;
    mfaVerified?: boolean;
  };
};

export const requireAuth = (tokenService: TokenService) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const cookieToken = req.cookies?.access_token as string | undefined;

    let token = cookieToken;
    if (!token && header) {
      const [type, value] = header.split(" ");
      if (type === "Bearer") {
        token = value;
      }
    }

    if (!token) {
      throw new AppError("Missing authorization token.", 401);
    }

    try {
      const payload = tokenService.verify(token);
      const mfaVerified = payload.mfaVerified ?? true;
      req.auth = {
        userId: payload.userId,
        permissionLevel: payload.permissionLevel,
        mfaVerified
      };

      if (mfaVerified === false) {
        const isAuthRoute = req.baseUrl === "/api/auth";
        const allowedPaths = new Set(["/mfa/setup", "/mfa/verify", "/me", "/logout"]);
        if (!isAuthRoute || !allowedPaths.has(req.path)) {
          throw new AppError("MFA required.", 401);
        }
      }
      next();
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError("Invalid token.", 401);
    }
  };
};

export const requirePermission = (allowed: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const permission = req.auth?.permissionLevel;
    if (!permission || !allowed.includes(permission)) {
      throw new AppError("Insufficient permissions.", 403);
    }
    next();
  };
};
