import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CommunityDashboard.css";

export default function CommunityDashboard() {
  const [summary, setSummary] = useState({
    totalPool: 0,
    totalAllocated: 0,
    availableBalance: 0,
  });
  const [form, setForm] = useState({
    centerName: "",
    amount: "",
    reason: "",
  });
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState({}); // Track proof upload per request

  // Fetch summary
  useEffect(() => {
    axios.get("http://localhost:5000/api/fundPool/summary")
      .then((res) => setSummary(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch requests
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/requests");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch transactions
  useEffect(() => {
    axios.get("http://localhost:5000/api/transactions")
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit new fund request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/requests", form);
      setRequests([res.data, ...requests]);
      setForm({ centerName: "", amount: "", reason: "" });
    } catch (err) {
      console.error("Error submitting request:", err);
      alert("Failed to submit request.");
    }
    setLoading(false);
  };

  // Upload proof file
  const handleProofUpload = async (requestId, file) => {
    if (!file) return;
    setUploadingProof({ ...uploadingProof, [requestId]: true });

    try {
      const formData = new FormData();
      formData.append("proof", file);

      const res = await axios.put(
        `http://localhost:5000/api/requests/${requestId}/proof`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Update request with proof URL
      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, proofUrl: res.data.proofUrl } : req
        )
      );
      alert("Proof uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload proof.");
    }

    setUploadingProof({ ...uploadingProof, [requestId]: false });
  };

  return (
    <div className="community-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Community Center</h2>
        <nav>
          <a href="#summary">📊 Fund Summary</a>
          <a href="#requests">📝 Fund Requests</a>
          <a href="#transactions">🔄 Transactions</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <h1>Community Dashboard</h1>

        {/* Fund Summary */}
        <section id="summary" className="summary">
          <div className="card">
            <h2>Total Pool</h2>
            <p className="green">₹{summary.totalPool}</p>
          </div>
          <div className="card">
            <h2>Allocated</h2>
            <p className="red">₹{summary.totalAllocated}</p>
          </div>
          <div className="card">
            <h2>Available</h2>
            <p className="blue">₹{summary.availableBalance}</p>
          </div>
        </section>

        {/* Fund Request Form */}
        <section id="requests">
          <h2>Raise Fund Request</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="centerName"
              placeholder="Center Name"
              value={form.centerName}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="reason"
              placeholder="Reason"
              value={form.reason}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>

          {/* Requests Table */}
          <h3>My Requests</h3>
          <table>
            <thead>
              <tr>
                <th>Center</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Proof</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td>{req.centerName}</td>
                  <td>₹{req.amount}</td>
                  <td>{req.reason}</td>
                  <td>{req.status}</td>
                  <td>
                    {/* Show upload only if Reviewed and no proof yet */}
                    {req.status === "Reviewed" && !req.proofUrl ? (
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) =>
                          handleProofUpload(req._id, e.target.files[0])
                        }
                        disabled={uploadingProof[req._id]}
                      />
                    ) : req.proofUrl ? (
                      <a href={req.proofUrl} target="_blank" rel="noreferrer">
                        View Proof
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    {req.remarks && req.remarks.length > 0 ? (
                      <ul style={{ paddingLeft: "15px" }}>
                        {req.remarks.map((r, idx) => (
                          <li key={idx}>
                            {r.remark}{" "}
                            <small>({new Date(r.createdAt).toLocaleString()})</small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No remarks yet"
                    )}
                  </td>
                  <td>{new Date(req.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Transactions Section */}
        <section id="transactions">
          <h2>Transactions</h2>
          {transactions.length === 0 ? (
            <p>No transactions recorded yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Center / Source</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>TxHash</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>{tx.type}</td>
                    <td>{tx.centerName || tx.source}</td>
                    <td>₹{tx.amount}</td>
                    <td>{tx.purpose}</td>
                    <td>{tx.txHash || "N/A"}</td>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
