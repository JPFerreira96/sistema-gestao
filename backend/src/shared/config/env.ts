import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, fallback?: string, allowEmpty = false): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    if (!allowEmpty) {
      throw new Error(`Missing env var: ${name}`);
    }
    return "";
  }
  return value;
}

const parseDurationToMs = (value: string, fallbackMs: number) => {
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return fallbackMs;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (Number.isNaN(amount)) {
    return fallbackMs;
  }
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return amount * (multipliers[unit] ?? fallbackMs);
};

const readNumber = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  db: {
    host: requireEnv("DB_HOST"),
    port: Number(requireEnv("DB_PORT", "3306")),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD", "", true),
    name: requireEnv("DB_NAME")
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000"
  },
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: requireEnv("JWT_EXPIRES_IN", "15m"),
    accessTokenMs: parseDurationToMs(requireEnv("JWT_EXPIRES_IN", "15m"), 15 * 60 * 1000)
  },
  security: {
    refreshTokenDays: readNumber("REFRESH_TOKEN_DAYS", 7),
    maxLoginAttempts: readNumber("MAX_LOGIN_ATTEMPTS", 5),
    lockoutMinutes: readNumber("LOCKOUT_MINUTES", 15)
  },
  cookies: {
    domain: process.env.COOKIE_DOMAIN,
    sameSite: (process.env.COOKIE_SAMESITE ?? "lax") as "lax" | "strict" | "none",
    secure:
      process.env.COOKIE_SECURE === "true" ? true : (process.env.NODE_ENV ?? "development") === "production"
  }
};
