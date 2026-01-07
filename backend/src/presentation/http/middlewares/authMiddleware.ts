import { NextFunction, Request, Response } from "express";
import { TokenService } from "../../../application/ports/TokenService";
import { AppError } from "../../../shared/errors/AppError";

export type AuthRequest = Request & {
  auth?: {
    userId: string;
    permissionLevel: string;
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
      req.auth = { userId: payload.userId, permissionLevel: payload.permissionLevel };
      next();
    } catch (err) {
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
