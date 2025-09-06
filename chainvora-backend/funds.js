// funds.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// ================== Approved Fund Schema ==================
const approvedFundSchema = new mongoose.Schema({
  centerName: { type: String, required: true },   // Which center got funds
  walletAddress: { type: String, required: false }, // Wallet for tracking
  amount: { type: Number, required: true },       // Fund amount
  purpose: { type: String, required: true },      // Reason for approval
  approvedBy: { type: String },                   // Admin who approved
  txHash: { type: String },                       // Mock blockchain hash
  createdAt: { type: Date, default: Date.now },
});

// Avoid model overwrite error in watch mode
const ApprovedFund =
  mongoose.models.ApprovedFund ||
  mongoose.model("ApprovedFund", approvedFundSchema);

// ================== Routes ==================

// Add new approved fund (POST /api/funds)
router.post("/", async (req, res) => {
  try {
    const { centerName, walletAddress, amount, purpose, approvedBy } = req.body;

    if (!centerName || !amount || !purpose) {
      return res
        .status(400)
        .json({ error: "centerName, amount, and purpose are required" });
    }

    const newApprovedFund = new ApprovedFund({
      centerName,
      walletAddress, // ✅ include wallet address if provided
      amount,
      purpose,
      approvedBy,
      txHash: "0x" + Math.random().toString(16).slice(2, 10),
    });

    await newApprovedFund.save();

    res.json(newApprovedFund);
  } catch (error) {
    console.error("❌ Error approving fund:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all approved funds (GET /api/funds)
router.get("/", async (req, res) => {
  try {
    const approvedFunds = await ApprovedFund.find().sort({ createdAt: -1 });
    res.json(approvedFunds);
  } catch (error) {
    console.error("❌ Error fetching approved funds:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
