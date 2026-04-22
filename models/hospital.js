const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  area: { type: String, default: "" },
  specializations: { type: [String], default: [] },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  about: { type: String, default: "" },
  website: { type: String, default: "" },
  doctors: [
    {
      name: { type: String },
      specialization: { type: String },
      experience: { type: Number, default: 0 },
    },
  ],
});
hospitalSchema.plugin(plm.default, {
  usernameField: "email",
});
module.exports = mongoose.model("Hospital", hospitalSchema);
