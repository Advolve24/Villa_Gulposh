// server.js
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
app.set("trust proxy", 1); // behind Render proxy

const ALLOWED = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "https://villagulposh.netlify.app",
]);

// must be present for cookies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);        // curl / health, etc.
      if (ALLOWED.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);
// handle preflight for all routes
app.options(
  "*",
  cors({
    origin: Array.from(ALLOWED),
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => res.send("API is up")); // optional health

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Connected! Running on ${port}`));
  })
  .catch(console.error);
