// backend/server.js
import "dotenv/config.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

const RAW = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const WHITELIST = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "https://villagulposh.netlify.app",
  ...RAW,
]);

// Allow Netlify deploy-preview subdomains like
// https://somehash--villagulposh.netlify.app
const NETLIFY_PREVIEW = /^https:\/\/[a-z0-9-]+--villagulposh\.netlify\.app$/i;

function isAllowed(origin) {
  if (!origin) return true; // server-to-server / health checks
  if (WHITELIST.has(origin)) return true;
  if (NETLIFY_PREVIEW.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, cb) {
      isAllowed(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

/* ---------------- Common middleware ---------------- */
app.use(express.json());
app.use(cookieParser());

/* ---------------- Simple root + health ---------------- */
app.get("/", (_req, res) => {
  res.send("Villa Gulposh API is running. Try /api/health");
});
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

/* ---------------- Real routes ---------------- */
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);

// Last: 404 JSON (optional)
app.use((req, res) => {
  res.status(404).json({ message: "Not found", path: req.originalUrl });
});

/* ---------------- Start ---------------- */
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`Connected! Running on ${PORT}`)))
  .catch(console.error);
