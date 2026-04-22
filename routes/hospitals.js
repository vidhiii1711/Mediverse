const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const Hospital = require("../models/hospital");

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

// GET /api/hospitals
// Returns all registered hospitals — used by patient booking page
router.get("/", auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find({})
      .select("-hash -salt") // never send password fields
      .lean();

    const formatted = hospitals.map((h) => ({
      _id:             h._id,
      name:            h.name,
      email:           h.email,
      area:            h.area            || "",
      rating:          h.rating          || null,
      specializations: h.specializations || [],
      doctors:         h.doctors         || [],
    }));

    res.json({ hospitals: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;