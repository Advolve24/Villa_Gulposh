import express from "express";
import { authRequired } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { createRoom } from "../controllers/admin.room.controller.js";

const router = express.Router();

router.post("/rooms", authRequired, adminOnly, createRoom);

export default router;
