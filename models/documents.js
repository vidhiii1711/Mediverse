const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  name:       { type: String, default: "" ,required:false},       // original filename
  size:       { type: String, default: "" },       // e.g. "248 KB"
  url:        { type: String, default: "" },       // file URL (local or cloud)
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", DocumentSchema);
