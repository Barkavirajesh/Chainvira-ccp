// server.js (backend only, no React here!)

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// Example POST route
app.post("/api/save-data", (req, res) => {
  const { walletAddress, role } = req.body;

  if (!walletAddress || !role) {
    return res.status(400).json({ message: "Wallet address and role are required" });
  }

  console.log("Received Data:", walletAddress, role);

  res.json({ message: "Data received successfully", data: { walletAddress, role } });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
