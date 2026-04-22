const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const Hospital = require("../models/hospital");

const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

// ── Auth middleware — same as hospitalAppointments.js ─────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "hospital")
      return res.status(403).json({ message: "Hospital access only" });
    req.hospital = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ── GET /api/hospital/profile
// Returns the logged-in hospital's full profile
router.get("/", auth, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.hospital.id)
      .select("-hash -salt"); // never send password fields
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    res.json({ hospital });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/hospital/profile
// Updates hospital profile — name, area, phone, address, about, website, specializations
// After save → patients see updated data automatically via GET /api/hospitals
router.patch("/", auth, async (req, res) => {
  try {
    const allowed = ["name", "area", "phone", "address", "about", "website", "specializations"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const hospital = await Hospital.findByIdAndUpdate(
      req.hospital.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-hash -salt");

    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    res.json({ hospital, message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/hospital/profile/password
// Change password — verifies old password first
router.patch("/password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Both current and new password required" });
  if (newPassword.length < 6)
    return res.status(400).json({ message: "New password must be at least 6 characters" });

  try {
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    // passport-local-mongoose provides changePassword
    hospital.changePassword(currentPassword, newPassword, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.name === "IncorrectPasswordError"
            ? "Current password is incorrect"
            : "Password change failed",
        });
      }
      res.json({ message: "Password updated successfully" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
