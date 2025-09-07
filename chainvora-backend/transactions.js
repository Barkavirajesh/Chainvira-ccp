// transactions.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// ✅ Use the existing Transaction model
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "Add Fund" | "Allocate Fund"
  source: { type: String },
  centerName: { type: String },
  walletAddress: { type: String },
  amount: { type: Number, required: true },
  purpose: { type: String },
  notes: { type: String },
  approvedBy: { type: String },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

// ================== Routes ==================

// Get all transactions (both Add + Allocate)
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
