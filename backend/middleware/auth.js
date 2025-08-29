import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const bearer = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    const token = req.cookies?.token || bearer;
    if (!token) return res.status(401).json({ message: "Auth required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
