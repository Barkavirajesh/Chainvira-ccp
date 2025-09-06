const mongoose = require("mongoose");

const fundPoolSchema = new mongoose.Schema(
  {
    source: String,
    amount: Number,
    purpose: String,
    notes: String,
    txHash: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("FundPool", fundPoolSchema);
