const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
const patientSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
   documents: [{
      type:mongoose.Schema.Types.ObjectId,ref:"documents"
  }],
});
patientSchema.plugin(plm.default, {
  usernameField: "email", // use email instead of username
});
module.exports = mongoose.model("Patient", patientSchema);
