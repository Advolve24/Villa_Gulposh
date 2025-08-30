import express from "express";
import {
  listRooms,
  getRoomById,
  getBlockedDates,
  getBlockedDatesAll,
} from "../controllers/room.controller.js";

const router = express.Router();

router.get("/", listRooms);

router.get("/blocked", getBlockedDatesAll); 

router.get("/:id/blocked", getBlockedDates);

router.get("/:id", getRoomById);

export default router;
