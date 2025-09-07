const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 5000;

// ================== Middleware ==================
app.use(cors());
app.use(express.json());

// ================== MongoDB Connection ==================
mongoose.connect("mongodb://127.0.0.1:27017/chainvora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// ================== Schemas + Models ==================

// Request Schema
const requestSchema = new mongoose.Schema({
  centerName: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Pending" }, // Pending / Approved / Rejected
  createdAt: { type: Date, default: Date.now },
});
const Request = mongoose.model("Request", requestSchema);

// User Schema
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  role: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

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
  mongoose.models.ApprovedFund ||
  mongoose.model("ApprovedFund", approvedFundSchema);

// Fund Schema
const fundSchema = new mongoose.Schema({
  source: { type: String, required: true },
  amount: { type: Number, required: true },
  purpose: { type: String, required: true },
  notes: { type: String },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Fund = mongoose.models.Fund || mongoose.model("Fund", fundSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "Add Fund", "Allocate Fund", "Request", "Approval"
  centerName: { type: String },
  source: { type: String },
  amount: { type: Number, required: true },
  purpose: { type: String },
  notes: { type: String },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

// ================== API Routes ==================

// --- Requests ---
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/requests", async (req, res) => {
  try {
    const { centerName, amount, reason, status } = req.body;
    const newRequest = new Request({ centerName, amount, reason, status });
    await newRequest.save();

    // Log as transaction
    const tx = new Transaction({
      type: "Request",
      centerName,
      amount,
      purpose: reason,
    });
    await tx.save();

    res.json(newRequest);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Approve / Reject request
app.put("/api/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await Request.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Request not found" });

    // Log approval/rejection as transaction
    const tx = new Transaction({
      type: status,
      centerName: updated.centerName,
      amount: updated.amount,
      purpose: updated.reason,
    });
    await tx.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Users ---
app.post("/api/users/connect", async (req, res) => {
  try {
    const { walletAddress, role } = req.body;
    if (!walletAddress || !role) {
      return res
        .status(400)
        .json({ error: "walletAddress and role are required" });
    }

    let user = await User.findOne({ walletAddress });
    if (user) {
      user.role = role;
      await user.save();
    } else {
      user = new User({ walletAddress, role });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Fund Pool ---
const fundPoolRoutes = require("./fundpool");
app.use("/api/fundPool", fundPoolRoutes);

// --- Funds ---
const fundsRoutes = require("./funds");
app.use("/api/funds", fundsRoutes);

// --- Transactions ---
const transactionRoutes = require("./transactions");
app.use("/api/transactions", transactionRoutes);


// --- Fund Timeline ---
app.get("/api/fundTimeline", async (req, res) => {
  try {
    const requests = await Request.find().select(
      "centerName amount reason status createdAt"
    );
    const approvals = await ApprovedFund.find().select(
      "centerName amount purpose approvedBy txHash createdAt"
    );
    const fundPool = await Fund.find().select(
      "source amount purpose createdAt"
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
      })),
      ...fundPool.map((f) => ({
        type: "Fund Added",
        centerName: f.source,
        amount: f.amount,
        description: f.purpose,
        status: "Fund Pool",
        date: f.createdAt,
      })),
    ];

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timeline);
  } catch (error) {
    console.error("❌ Error fetching timeline:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Proof of Spend Upload ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // save in uploads/ folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

const upload = multer({ storage: storage });

app.post("/api/proofUpload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    message: "File uploaded successfully",
    filePath: `/uploads/${req.file.filename}`,
  });
});

// Make uploads folder accessible
app.use("/uploads", express.static("uploads"));

// ================== Start Server ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
