const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const Appointment = require("../models/appointments");

const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// GET /api/appointment — all upcoming appointment for this patient
router.get("/", auth, async (req, res) => {
  try {
    const today = new Date();
    const appts = await Appointment.find({
      patient: req.user.id,
    }).sort({ date: 1 });
    res.json({ appointments: appts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/appointment — book new appointment
router.post("/", auth, async (req, res) => {
  try {
    const { hospital, hospitalId,doctor,specialization,date, patientName, age, reason } = req.body;

    if (!hospital || !date || !patientName || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const appt = await Appointment.create({
      patient:        req.user.id,
      hospital,
      hospitalId,
      doctor:         doctor || "To be assigned",
      specialization,
      date:           new Date(date),
      patientName,
      age:            Number(age) || 0,
      reason,
      status:         "pending",
    });

    res.status(201).json({ appointment: appt });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/appointment/:id — update status (hospital confirms/cancels)
router.patch("/:id", auth, async (req, res) => {
  try {
    const appt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patient: req.user.id },
      req.body,
      { new: true }
    );
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointments: appt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/appointment/:id — cancel/delete
router.delete("/:id", auth, async (req, res) => {
  try {
    await Appointment.findOneAndDelete({ _id: req.params.id, patient: req.user.id });
    res.json({ message: "Appointment cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/appointment/hospital/:hospitalId — hospital sees its bookings
// (used in hospital dashboard)
router.get("/hospital/:hospitalId", auth, async (req, res) => {
  try {
    const appts = await Appointment.find({ hospitalId: req.params.hospitalId })
      .sort({ date: 1 });
    res.json({ appointments: appts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
