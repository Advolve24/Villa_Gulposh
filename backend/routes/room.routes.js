import express from "express";
import {
  listRooms,
  getRoomById,
  getBlockedDates,
} from "../controllers/room.controller.js";

const router = express.Router();

router.get("/", listRooms);

router.get("/:id/blocked", getBlockedDates);

router.get("/:id", getRoomById);

export default router;
