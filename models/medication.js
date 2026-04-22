const mongoose = require("mongoose");

const MedicationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  name:     { type: String, required: true },
  dose:     { type: String, default: "" },
  frequency:{ type: String, default: "Once daily" },
  time:     { type: String, default: "" },       // primary time "HH:MM"
  timings:  { type: [String], default: [] },     // ["08:00", "20:00"]
  instructions: { type: String, default: "" },
  colorIndex:   { type: Number, default: 0 },
  enabled:  { type: Boolean, default: true },
  notificationEnabled: { type: Boolean, default: true },
  takenDates: { type: [String], default: [] },   // ["2025-03-13", ...]
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Medication", MedicationSchema);
