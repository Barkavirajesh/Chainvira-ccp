const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema(
  {
    centerName: { type: String, required: true },
    update: { type: String, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", StatusSchema);
