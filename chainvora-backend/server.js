const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/chainvora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema for storing wallet and role
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Endpoint to store wallet-role
app.post("/api/connectWallet", async (req, res) => {
  const { walletAddress, role } = req.body;

  try {
    const existing = await User.findOne({ walletAddress });

    if (existing) {
      if (existing.role === role) {
        return res.status(200).json({ message: "Wallet already connected with this role" });
      } else {
        return res.status(400).json({ message: `Wallet already connected with a different role (${existing.role})` });
      }
    }

    const user = new User({ walletAddress, role });
    await user.save();
    res.status(200).json({ message: "Wallet connected and stored successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));
