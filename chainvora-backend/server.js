// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// ================== Middleware ==================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ================== MongoDB Connection ==================
mongoose.connect("mongodb://127.0.0.1:27017/chainvora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => console.log("✅ MongoDB connected"));
mongoose.connection.on("error", (err) =>
  console.error("❌ MongoDB connection error:", err)
);

// ================== Schemas ==================

// Request Schema
const requestSchema = new mongoose.Schema({
  centerName: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Pending" },
  proofUrl: { type: String }, // Uploaded proof
  remarks: [{ remark: String, createdAt: { type: Date, default: Date.now } }],
  approvedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);

// User Schema
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  role: { type: String, required: true },
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Approved Fund Schema
const approvedFundSchema = new mongoose.Schema({
  centerName: { type: String, required: true },
  walletAddress: { type: String },
  amount: { type: Number, required: true },
  purpose: { type: String, required: true },
  approvedBy: { type: String },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const ApprovedFund =
  mongoose.models.ApprovedFund || mongoose.model("ApprovedFund", approvedFundSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  centerName: { type: String },
  source: { type: String },
  amount: { type: Number, required: true },
  purpose: { type: String },
  approvedBy: { type: String },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

// ================== Multer Setup ==================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ================== API Routes ==================

// --- Public APIs ---
app.get("/api/public/approved", async (req, res) => {
  try {
    const funds = await ApprovedFund.find().sort({ createdAt: -1 });
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/status", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    const statusUpdates = requests.map((r) => ({
      centerName: r.centerName,
      status: r.status,
      date: r.createdAt,
      remarks: r.remarks || [],
    }));
    res.json(statusUpdates);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/fundTimeline", async (req, res) => {
  try {
    const requests = await Request.find().select(
      "centerName amount reason status createdAt"
    );
    const approvals = await ApprovedFund.find().select(
      "centerName amount purpose approvedBy txHash createdAt"
    );

    const timeline = [
      ...requests.map((r) => ({
        type: "Request",
        centerName: r.centerName,
        amount: r.amount,
        description: r.reason,
        status: r.status,
        date: r.createdAt,
      })),
      ...approvals.map((a) => ({
        type: "Approved",
        centerName: a.centerName,
        amount: a.amount,
        description: a.purpose,
        status: "Approved by " + (a.approvedBy || "Admin"),
        date: a.createdAt,
        txHash: a.txHash,
      })),
    ];

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Requests ---
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/requests", async (req, res) => {
  try {
    const { centerName, amount, reason } = req.body;
    const newRequest = new Request({ centerName, amount, reason });
    await newRequest.save();

    // Log transaction
    await new Transaction({
      type: "Request",
      centerName,
      amount,
      purpose: reason,
    }).save();

    res.json(newRequest);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Approve / Reject
app.put("/api/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    const updated = await Request.findByIdAndUpdate(
      id,
      { status, approvedBy },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Request not found" });

    // Log transaction
    await new Transaction({
      type: status,
      centerName: updated.centerName,
      amount: updated.amount,
      purpose: updated.reason,
      approvedBy,
    }).save();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Remarks ---
app.post("/api/requests/:id/remark", async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    request.remarks.push({ remark });
    await request.save();

    res.json({ message: "Remark added successfully", request });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Proof Upload ---
app.put("/api/requests/:id/proof", upload.single("proof"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const proofUrl = `/uploads/${req.file.filename}`;
    const updated = await Request.findByIdAndUpdate(
      id,
      { proofUrl },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Request not found" });

    res.json({ message: "Proof uploaded successfully", proofUrl });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Users ---
app.post("/api/users/connect", async (req, res) => {
  try {
    const { walletAddress, role } = req.body;
    if (!walletAddress || !role)
      return res.status(400).json({ error: "walletAddress and role required" });

    let user = await User.findOne({ walletAddress });
    if (user) {
      user.role = role;
      await user.save();
    } else {
      user = new User({ walletAddress, role });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================== Start Server ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
