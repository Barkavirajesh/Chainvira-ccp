// fundpool.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// ================== Fund Schema ==================
const fundSchema = new mongoose.Schema({
  source: { type: String, required: true },       // Government Grant, NGO, etc.
  amount: { type: Number, required: true },       // Amount of funds
  purpose: { type: String, required: true },      // Education, Healthcare, etc.
  notes: { type: String },                        // Optional notes
  txHash: { type: String },                       // Placeholder for blockchain hash
  createdAt: { type: Date, default: Date.now },   // Auto timestamp
});

// ✅ Prevent OverwriteModelError
const Fund = mongoose.models.Fund || mongoose.model("Fund", fundSchema);

// ================== Transaction Schema ==================
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "Add Fund"
  source: { type: String },
  amount: { type: Number, required: true },
  purpose: { type: String },
  notes: { type: String },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

// ================== Routes ==================

// Add new fund (POST /api/fundPool)
router.post("/", async (req, res) => {
  try {
    const { source, amount, purpose, notes } = req.body;

    if (!source || !amount || !purpose) {
      return res
        .status(400)
        .json({ error: "Source, amount, and purpose are required" });
    }

    // Generate mock tx hash
    const txHash = "0x" + Math.random().toString(16).slice(2, 10);

    // Save to Fund collection
    const newFund = new Fund({
      source,
      amount,
      purpose,
      notes,
      txHash,
    });
    await newFund.save();

    // ✅ Also log into Transaction collection
    const newTransaction = new Transaction({
      type: "Add Fund",
      source,
      amount,
      purpose,
      notes,
      txHash,
    });
    await newTransaction.save();

    res.json(newFund);
  } catch (error) {
    console.error("❌ Error adding fund:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all funds (GET /api/fundPool)
router.get("/", async (req, res) => {
  try {
    const funds = await Fund.find().sort({ createdAt: -1 });
    res.json(funds);
  } catch (error) {
    console.error("❌ Error fetching funds:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get fund summary (total pool, total allocated, available balance)
router.get("/summary", async (req, res) => {
  try {
    // Aggregate total pool
    const poolFunds = await Fund.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // ✅ Safe ApprovedFund model reference
    const ApprovedFund =
      mongoose.models.ApprovedFund ||
      mongoose.model("ApprovedFund");

    const allocatedFunds = await ApprovedFund.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalPool = poolFunds.length > 0 ? poolFunds[0].total : 0;
    const totalAllocated = allocatedFunds.length > 0 ? allocatedFunds[0].total : 0;
    const availableBalance = totalPool - totalAllocated;

    res.json({ totalPool, totalAllocated, availableBalance });
  } catch (error) {
    console.error("❌ Error fetching summary:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
