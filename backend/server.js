// server.js
import "dotenv/config.js";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
app.set("trust proxy", 1);

// ——— CORS (Render/Netlify, with cookies) ———
const ALLOWED = [
  "https://villagulposh.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

// one middleware handles both normal and preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin"); // proxies/CDN correctness
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ——— standard middlewares ———
app.use(express.json());
app.use(cookieParser());

// optional health check
app.get("/", (_req, res) => res.send("API is up"));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);

// ——— DB + start ———
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Connected! Running on ${port}`));
  })
  .catch(console.error);
