const mongoose = require("mongoose");

const MilestoneSchema = new mongoose.Schema(
  {
    centerName: { type: String, required: true },
    milestone: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Milestone", MilestoneSchema);
