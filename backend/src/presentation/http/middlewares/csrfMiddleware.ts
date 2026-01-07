import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";

export const requireCsrf = (req: Request, _res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const cookieToken = req.cookies?.csrf_token as string | undefined;
  const headerToken = req.headers["x-csrf-token"] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new AppError("Invalid CSRF token.", 403);
  }

  return next();
};
