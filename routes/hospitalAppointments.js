const express     = require("express");
const router      = express.Router();
const jwt         = require("jsonwebtoken");
const Appointment = require("../models/appointments");

const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

// ── Auth middleware ────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "hospital") {
      return res.status(403).json({ message: "Hospital access only" });
    }
    req.hospital = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ── GET /api/hospital/appointments ────────────────────────────────────────────
// Returns all appointments booked at this hospital
router.get("/", auth, async (req, res) => {
  try {
    const appts = await Appointment.find({
      hospitalId: req.hospital.id,
    }).sort({ date: 1 });
    res.json({ appointments: appts });
  } catch (err) {
    console.error("GET hospital appointments error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/hospital/appointments/:id/confirm ──────────────────────────────
// Hospital confirms → status = "confirmed"
// Patient's /api/appointments fetches same document → shows "confirmed"
router.patch("/:id/confirm", auth, async (req, res) => {
  try {
    const appt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, hospitalId: req.hospital.id },
      { status: "confirmed" },
      { new: true }
    );
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    console.log(`Appointment ${req.params.id} confirmed by hospital ${req.hospital.name}`);
    res.json({ appointment: appt, message: "Appointment confirmed successfully" });
  } catch (err) {
    console.error("Confirm appointment error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/hospital/appointments/:id/cancel ───────────────────────────────
// Hospital cancels → status = "cancelled"
// Patient's /api/appointments fetches same document → shows "cancelled"
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const appt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, hospitalId: req.hospital.id },
      { status: "cancelled" },
      { new: true }
    );
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    console.log(`Appointment ${req.params.id} cancelled by hospital ${req.hospital.name}`);
    res.json({ appointment: appt, message: "Appointment cancelled successfully" });
  } catch (err) {
    console.error("Cancel appointment error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
