import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "../shared/config/env";
import { errorHandler } from "../presentation/http/middlewares/errorHandler";
import { buildUserModule } from "./assemblies/userAssembly";
import { buildAuthModule } from "./assemblies/authAssembly";
import { buildEventModule } from "./assemblies/eventAssembly";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.cors.origin,
    credentials: true
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    hsts:
      env.nodeEnv === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", buildAuthModule());
app.use("/api/users", buildUserModule());
app.use("/api/events", buildEventModule());

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API running on port ${env.port}`);
});
