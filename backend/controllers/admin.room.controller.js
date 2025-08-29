import Room from "../models/Room.js";

const toArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string") {
    return v
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const createRoom = async (req, res) => {
  const {
    name,
    pricePerNight,
    priceWithMeal,
    coverImage,
    galleryImages,
    description,
    roomServices,
    accommodation,
  } = req.body || {};

  if (!name || pricePerNight === undefined || pricePerNight === null) {
    return res.status(400).json({ message: "name and pricePerNight are required" });
  }

  const room = await Room.create({
    name: String(name).trim(),
    pricePerNight: Number(pricePerNight) || 0,
    priceWithMeal: Number(priceWithMeal) || 0,
    coverImage: coverImage || "",
    galleryImages: toArray(galleryImages),
    description: description || "",
    roomServices: toArray(roomServices),
    accommodation: toArray(accommodation),
  });

  res.status(201).json(room);
};
