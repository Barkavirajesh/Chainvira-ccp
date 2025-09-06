const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect("mongodb://127.0.0.1:27017/chainvora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema + Model
const requestSchema = new mongoose.Schema({
  centerName: String,
  amount: Number,
  reason: String,
  status: String,
});
const Request = mongoose.model("Request", requestSchema);

// API routes
app.get("/api/requests", async (req, res) => {
  const requests = await Request.find();
  res.json(requests);
});

app.post("/api/requests", async (req, res) => {
  const { centerName, amount, reason, status } = req.body;
  const newRequest = new Request({ centerName, amount, reason, status });
  await newRequest.save();
  res.json(newRequest);
});

app.put("/api/requests/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await Request.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  res.json(updated);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


