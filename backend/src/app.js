import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";

export const app = express();

app.use(helmet());
app.use(express.json({ limit: "200kb" }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => res.json({ ok: true, service: "tropical-gardens-api" }));
app.use("/api/auth", authRouter);
app.use("/api", publicRouter);
app.use("/api/admin", adminRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});
