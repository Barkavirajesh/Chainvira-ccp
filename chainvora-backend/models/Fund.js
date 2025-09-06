// models/Fund.js
const mongoose = require("mongoose");

const fundSchema = new mongoose.Schema({
  centerName: String,
  walletAddress: String,
  totalAllocated: { type: Number, default: 0 },
});

module.exports = mongoose.model("Fund", fundSchema);
