const express    = require("express");
const router     = express.Router();
const jwt        = require("jsonwebtoken");
const Medication = require("../models/medication");

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

// GET /api/medications
router.get("/", auth, async (req, res) => {
  try {
    const meds  = await Medication.find({ patient: req.user.id });
    const today = new Date().toISOString().split("T")[0];
    const formatted = meds.map((m) => ({
      ...m.toObject(),
      takenToday: m.takenDates.includes(today),
    }));
    res.json({ medications: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/medications
router.post("/", auth, async (req, res) => {
  try {
    const med = await Medication.create({ ...req.body, patient: req.user.id });
    res.status(201).json({ medication: { ...med.toObject(), takenToday: false } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/medications/:id — update fields (toggle notif, enable/disable)
router.patch("/:id", auth, async (req, res) => {
  try {
    const med = await Medication.findOneAndUpdate(
      { _id: req.params.id, patient: req.user.id },
      req.body,
      { new: true }
    );
    if (!med) return res.status(404).json({ message: "Not found" });
    res.json({ medication: med });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/medications/:id/taken — mark dose taken today
router.post("/:id/taken", auth, async (req, res) => {
  try {
    const today = req.body.date || new Date().toISOString().split("T")[0];
    const med   = await Medication.findOneAndUpdate(
      { _id: req.params.id, patient: req.user.id },
      { $addToSet: { takenDates: today } },
      { new: true }
    );
    if (!med) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Marked taken", medication: { ...med.toObject(), takenToday: true } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/medications/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    await Medication.findOneAndDelete({ _id: req.params.id, patient: req.user.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
