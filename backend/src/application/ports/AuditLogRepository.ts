export type AuditLogInput = {
  userId: string | null;
  action: string;
  ip: string | null;
  userAgent: string | null;
  metadata?: Record<string, unknown> | null;
};

export interface AuditLogRepository {
  log(entry: AuditLogInput): Promise<void>;
}
