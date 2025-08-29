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
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || "").
  split(",").map(s => s.trim()).filter(Boolean), 
  credentials: true 
})); 


app.use(express.json()); 
app.use(cookieParser()); 
app.use("/api/auth", authRoutes); 
app.use("/api/rooms", roomRoutes); 
app.use("/api/payments", paymentsRoutes); 
app.use("/api/admin", adminRoutes); 

mongoose.connect(process.env.MONGO_URL).then(() => 
  { app.listen(process.env.PORT, () => 
    console.log(`Connected! Running on ${process.env.PORT}`)); }).catch(console.error);