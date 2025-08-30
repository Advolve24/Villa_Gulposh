import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const normalizeEmail = (e = "") => String(e).trim().toLowerCase();

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,             // must be true for SameSite=None
    sameSite: isProd ? "none" : "lax",  // <-- key change
    path: "/",                  // good hygiene
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};


export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: (name || "").trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    res.json({ id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Failed to register" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    res.json({ id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const logout = (req, res) => {
  const isProd =
    process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";

  const cookieOpts = {
    httpOnly: true,
    secure: isProd,                
    sameSite: isProd ? "none" : "lax",
    path: "/",                     
  };
  res.clearCookie("token", cookieOpts);
  res.clearCookie("token", { ...cookieOpts, sameSite: "lax" });
  res.cookie("token", "", { ...cookieOpts, expires: new Date(0) });
  return res.json({ message: "Logged out" });
};

export const me = async (req, res) => {
  const u = await User.findById(req.user.id).select("name email isAdmin");
  if (!u) return res.status(401).json({ message: "Unauthorized" });
  res.json({ id: u._id, name: u.name, email: u.email, isAdmin: !!u.isAdmin });
};
