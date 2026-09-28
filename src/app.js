import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

export const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

const isLocalhost = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = same-origin requests, curl, server-to-server, etc. — always allow
      if (!origin) return callback(null, true);

      // In development, accept any localhost/127.0.0.1 port so Vite bumping
      // ports (8080 -> 8081 -> ...) never breaks CORS again
      if (process.env.NODE_ENV === "development" && isLocalhost(origin)) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true, // required so the httpOnly refresh cookie is sent/received
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);