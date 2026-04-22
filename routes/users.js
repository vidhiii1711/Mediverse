const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Patient = require("../models/patient");
const Hospital = require("../models/hospital");

const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

/*PATIENT REGISTER*/
router.post("/patient/register", async (req, res) => {
  console.log("PATIENT REGISTER BODY:", req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }
  try {
    const patient = new Patient({ name, email });
    await Patient.register(patient, password);
    return res.json({ success: true, role: "patient" });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    return res.status(400).json({ message: err.message });
  }
});

/*PATIENT LOGIN*/
router.post("/patient/login", (req, res) => {
  Patient.authenticate()(req.body.email, req.body.password, (err, patient, info) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!patient) return res.status(401).json({ message: info.message });

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: patient._id, role: "patient", name: patient.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      patient: { id: patient._id, name: patient.name, email: patient.email }
    });
  });
});

router.post("/hospital/register", async (req, res) => {
  console.log("HOSPITAL REGISTER BODY:", req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });
  try {
    const hospital = new Hospital({ name, email });
    await Hospital.register(hospital, password);
    return res.json({ success: true, role: "hospital" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*HOSPITAL LOGIN*/
router.post("/hospital/login", (req, res) => {
  Hospital.authenticate()(req.body.email, req.body.password, (err, hospital, info) => {
    if (err)       return res.status(500).json({ message: "Server error" });
    if (!hospital) return res.status(401).json({ message: info.message });
    const token = jwt.sign(
      { id: hospital._id, role: "hospital", name: hospital.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({
      success: true, token,
      hospital: { id: hospital._id, name: hospital.name, email: hospital.email }
    });
  });
});

/*GET /api/auth/me*/
router.get("/me", (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ user: decoded });
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
});

module.exports = router;