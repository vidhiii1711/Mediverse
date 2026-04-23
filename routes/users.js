// const express = require("express");
// const router = express.Router();
// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const Patient = require("../models/patient");
// const Hospital = require("../models/hospital");

// const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

// /*PATIENT REGISTER*/
// router.post("/patient/register", async (req, res) => {
//   console.log("PATIENT REGISTER BODY:", req.body);
//   const { name, email, password } = req.body;
//   if (!name || !email || !password) {
//     return res.status(400).json({ message: "All fields required" });
//   }
//   try {
//     const patient = new Patient({ name, email });
//     await Patient.register(patient, password);
//     return res.json({ success: true, role: "patient" });
//   } catch (err) {
//     console.error("REGISTER ERROR:", err.message);
//     return res.status(400).json({ message: err.message });
//   }
// });

/*PATIENT LOGIN*/
// router.post("/patient/login", (req, res) => {
//   Patient.authenticate()(req.body.email, req.body.password, (err, patient, info) => {
//     if (err) return res.status(500).json({ message: "Server error" });
//     if (!patient) return res.status(401).json({ message: info.message });

//     // ✅ Generate JWT token
//     const token = jwt.sign(
//       { id: patient._id, role: "patient", name: patient.name },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.json({
//       success: true,
//       token,
//       patient: { id: patient._id, name: patient.name, email: patient.email }
//     });
//   });
// });
// router.post("/patient/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password)
//     return res.status(400).json({ message: "All fields required" });
  // if (mongoose.connection.readyState !== 1) {
  //   return res.status(503).json({ message: "Database not ready, try again in a moment" });
  // }

//   try {
//     const patient = await Patient.findOne({ email });
//     if (!patient)
//       return res.status(401).json({ message: "No account found with this email" });

//     patient.authenticate(password, (err, user) => {  // ← named 'user' here
//       if (err) {
//         console.error("AUTH ERROR:", err);
//         return res.status(500).json({ message: "Server error" });
//       }
//       if (!user) {  // ← now matches
//         return res.status(401).json({ message: "Incorrect password" });
//       }

//       const token = jwt.sign(
//         { id: patient._id, role: "patient", name: patient.name },
//         JWT_SECRET,
//         { expiresIn: "7d" }
//       );

//       return res.json({
//         success: true,
//         token,
//         patient: { id: patient._id, name: patient.name, email: patient.email },
//       });
//     });
//   } catch (err) {
//     console.error("LOGIN ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });


// router.post("/hospital/register", async (req, res) => {
//   console.log("HOSPITAL REGISTER BODY:", req.body);
//   const { name, email, password } = req.body;
//   if (!name || !email || !password)
//     return res.status(400).json({ message: "All fields required" });
//   try {
//     const hospital = new Hospital({ name, email });
//     await Hospital.register(hospital, password);
//     return res.json({ success: true, role: "hospital" });
//   } catch (err) {
//     return res.status(400).json({ message: err.message });
//   }
// });

/*HOSPITAL LOGIN*/
// router.post("/hospital/login", (req, res) => {
//   Hospital.authenticate()(req.body.email, req.body.password, (err, hospital, info) => {
//     if (err)       return res.status(500).json({ message: "Server error" });
//     if (!hospital) return res.status(401).json({ message: info.message });
//     const token = jwt.sign(
//       { id: hospital._id, role: "hospital", name: hospital.name },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );
//     return res.json({
//       success: true, token,
//       hospital: { id: hospital._id, name: hospital.name, email: hospital.email }
//     });
//   });
// });
// router.post("/hospital/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password)
//     return res.status(400).json({ message: "All fields required" });
  // if (mongoose.connection.readyState !== 1) {
  //   return res.status(503).json({ message: "Database not ready, try again in a moment" });
  // }


//   try {
//     const hospital = await Hospital.findOne({ email });
//     if (!hospital)
//       return res.status(401).json({ message: "No account found with this email" });

//     hospital.authenticate(password, (err, user) => {  // ← named 'user' here
//       if (err) {
//         console.error("AUTH ERROR:", err);
//         return res.status(500).json({ message: "Server error" });
//       }
//       if (!user) {  // ← now matches
//         return res.status(401).json({ message: "Incorrect password" });
//       }

//       const token = jwt.sign(
//         { id: hospital._id, role: "hospital", name: hospital.name },
//         JWT_SECRET,
//         { expiresIn: "7d" }
//       );

//       return res.json({
//         success: true,
//         token,
//         hospital: { id: hospital._id, name: hospital.name, email: hospital.email },
//       });
//     });
//   } catch (err) {
//     console.error("LOGIN ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });
// /*GET /api/auth/me*/
// router.get("/me", (req, res) => {
//   const header = req.headers.authorization;
//   if (!header) return res.status(401).json({ message: "No token" });
//   const token = header.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     return res.json({ user: decoded });
//   } catch {
//     return res.status(401).json({ message: "Session expired. Please log in again." });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Patient = require("../models/patient");
const Hospital = require("../models/hospital");

const JWT_SECRET = process.env.JWT_SECRET || "mediverse-secret";

/* PATIENT REGISTER */
router.post("/patient/register", async (req, res) => {
  console.log("PATIENT REGISTER BODY:", req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });
  try {
    const patient = new Patient({ name, email });
    await Patient.register(patient, password);
    return res.json({ success: true, role: "patient" });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    return res.status(400).json({ message: err.message });
  }
});

/* PATIENT LOGIN */
router.post("/patient/login", async (req, res) => {
  console.log("PATIENT LOGIN HIT:", req.body);
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });
  try {
    const result = await Patient.authenticate()(email, password);
    console.log("AUTH RESULT:", result);
    
    // passport-local-mongoose returns {user, error}
    if (!result.user) {
      return res.status(401).json({ message: result.error?.message || "Invalid credentials" });
    }
    
    const patient = result.user;
    const token = jwt.sign(
      { id: patient._id, role: "patient", name: patient.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({
      success: true,
      token,
      patient: { id: patient._id, name: patient.name, email: patient.email },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* HOSPITAL REGISTER */
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

/* HOSPITAL LOGIN */
router.post("/hospital/login", async (req, res) => {
  console.log("HOSPITAL LOGIN HIT:", req.body);
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });
  try {
    const result = await Hospital.authenticate()(email, password);
    console.log("HOSPITAL AUTH RESULT:", result);

    if (!result.user) {
      return res.status(401).json({ message: result.error?.message || "Invalid credentials" });
    }

    const hospital = result.user;
    const token = jwt.sign(
      { id: hospital._id, role: "hospital", name: hospital.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({
      success: true,
      token,
      hospital: { id: hospital._id, name: hospital.name, email: hospital.email },
    });
  } catch (err) {
    console.error("HOSPITAL LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

/* GET /api/auth/me */
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
