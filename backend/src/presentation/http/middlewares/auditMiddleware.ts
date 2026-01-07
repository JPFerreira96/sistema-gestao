import { NextFunction, Request, Response } from "express";
import { AuditLogRepository } from "../../../application/ports/AuditLogRepository";
import { AuthRequest } from "./authMiddleware";

const getIp = (req: Request): string | null => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip ?? null;
};

export const auditLogger = (repository: AuditLogRepository, action?: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      const status = res.statusCode;
      repository
        .log({
          userId: req.auth?.userId ?? null,
          action: action ?? `${req.method} ${req.baseUrl}${req.path}`,
          ip: getIp(req),
          userAgent: req.headers["user-agent"] ?? null,
          metadata: {
            status,
            method: req.method,
            path: `${req.baseUrl}${req.path}`
          }
        })
        .catch(() => undefined);
    });
    next();
  };
};
