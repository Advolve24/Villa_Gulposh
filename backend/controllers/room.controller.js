import mongoose from "mongoose";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";

const { isValidObjectId } = mongoose;


export const listRooms = async (_req, res) => {
  try {
    const rooms = await Room.find()
      .select("name coverImage pricePerNight priceWithMeal description accommodation maxGuests");
    res.json(rooms);
  } catch (err) {
    console.error("listRooms error:", err);
    res.status(500).json({ message: "Failed to load rooms" });
  }
};


export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid room id" });
    }
    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    console.error("getRoomById error:", err);
    res.status(500).json({ message: "Failed to load room" });
  }
};


export const getBlockedDates = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid room id" });
    }
    const bookings = await Booking.find({
      room: id,
      status: { $ne: "cancelled" },
    }).select("startDate endDate");

    res.json(
      bookings.map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
      }))
    );
  } catch (err) {
    console.error("getBlockedDates error:", err);
    res.status(500).json({ message: "Failed to load blocked dates" });
  }
};


export const getBlockedDatesAll = async (_req, res) => {
  const bookings = await Booking.find({ status: { $ne: "cancelled" } })
    .select("startDate endDate");
  res.json(bookings.map(b => ({
    startDate: b.startDate,
    endDate: b.endDate
  })));
};
