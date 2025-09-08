import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function AuditorDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("transactions");
  const [overview, setOverview] = useState({
    requests: [],
    transactions: [],
  });
  const [remarks, setRemarks] = useState("");
  const [selectedRequest, setSelectedRequest] = useState("");
  const [verifying, setVerifying] = useState({});
  const navigate = useNavigate();

  const API_BASE = "http://localhost:5000"; // backend base URL

  // ---------------- Fetch Auditor Overview ----------------
  const fetchOverview = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auditor/overview`);
      setOverview(res.data);
    } catch (err) {
      console.error("Error fetching auditor overview:", err);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // ---------------- Logout ----------------
  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  // ---------------- Verify Proof ----------------
  const handleVerifyProof = async (requestId) => {
    setVerifying({ ...verifying, [requestId]: true });
    try {
      await axios.put(`${API_BASE}/api/requests/${requestId}`, {
        status: "Approved",
        approvedBy: "Auditor",
      });
      alert("✅ Proof verified successfully!");
      fetchOverview(); // refresh after update
    } catch (err) {
      console.error("Error verifying proof:", err);
      alert("❌ Failed to verify proof.");
    }
    setVerifying({ ...verifying, [requestId]: false });
  };

  // ---------------- Submit Remark ----------------
  const handleRemarkSubmit = async () => {
    if (!selectedRequest || !remarks.trim()) {
      alert("⚠ Please select a request and write a remark.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/requests/${selectedRequest}/remark`, {
        remark: remarks,
      });
      alert("✅ Remark submitted successfully!");
      setRemarks("");
      setSelectedRequest("");
      fetchOverview();
    } catch (err) {
      console.error("Error submitting remark:", err);
      alert("❌ Failed to submit remark.");
    }
  };

  return (
    <div className="d-flex vh-100">
      {/* ---------------- Sidebar ---------------- */}
      <div className="bg-dark text-white p-3" style={{ width: "250px" }}>
        <h4 className="mb-4">Auditor Panel</h4>
        <button
          className={`btn w-100 mb-2 ${
            activeTab === "transactions" ? "btn-primary" : "btn-outline-light"
          }`}
          onClick={() => setActiveTab("transactions")}
        >
          View Approved Transactions
        </button>
        <button
          className={`btn w-100 mb-2 ${
            activeTab === "proofs" ? "btn-primary" : "btn-outline-light"
          }`}
          onClick={() => setActiveTab("proofs")}
        >
          Verify Proofs
        </button>
        <button
          className={`btn w-100 mb-2 ${
            activeTab === "remarks" ? "btn-primary" : "btn-outline-light"
          }`}
          onClick={() => setActiveTab("remarks")}
        >
          Add Remarks
        </button>
        <button className="btn btn-danger w-100 mt-3" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ---------------- Main Content ---------------- */}
      <div className="flex-grow-1 p-4 bg-light overflow-auto">
        {/* ---------------- Transactions Tab ---------------- */}
        {activeTab === "transactions" && (
          <div>
            <h2 className="text-primary mb-3">Approved Transactions</h2>
            {overview.transactions.length === 0 ? (
              <p>No approved transactions available.</p>
            ) : (
              <table className="table table-bordered table-striped bg-white">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Center / Source</th>
                    <th>Amount</th>
                    <th>Purpose</th>
                    <th>Approved By</th>
                    <th>TxHash</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.transactions.map((txn, index) => (
                    <tr key={index}>
                      <td>{txn._id}</td>
                      <td>{txn.centerName || txn.source}</td>
                      <td>₹{txn.amount}</td>
                      <td>{txn.purpose}</td>
                      <td>{txn.approvedBy || "Admin"}</td>
                      <td>{txn.txHash || "-"}</td>
                      <td>{new Date(txn.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ---------------- Proofs Tab ---------------- */}
        {activeTab === "proofs" && (
          <div>
            <h2 className="text-primary mb-3">Completion Proofs</h2>
            {overview.requests.filter((r) => r.proof).length === 0 ? (
              <p>No proofs uploaded yet.</p>
            ) : (
              overview.requests
                .filter((r) => r.proof)
                .map((req) => (
                  <div className="card mb-3" key={req._id}>
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{req.centerName}</strong> - ₹{req.amount} -{" "}
                        {req.reason}
                        <br />
                        Proof:{" "}
                        <a
                          href={`${API_BASE}${req.proof}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📎 View
                        </a>
                        <br />
                        Status:{" "}
                        {req.status === "Approved"
                          ? "✅ Approved"
                          : "❌ Not Verified"}
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleVerifyProof(req._id)}
                        disabled={req.status === "Approved" || verifying[req._id]}
                      >
                        {req.status === "Approved"
                          ? "✅ Approved"
                          : verifying[req._id]
                          ? "Verifying..."
                          : "Verify"}
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ---------------- Remarks Tab ---------------- */}
        {activeTab === "remarks" && (
          <div>
            <h2 className="text-primary mb-3">Add Remarks</h2>
            <label>Select Community Center Request</label>
            <select
              className="form-control mb-3"
              value={selectedRequest}
              onChange={(e) => setSelectedRequest(e.target.value)}
            >
              <option value="">-- Select a Request --</option>
              {overview.requests.map((req) => (
                <option key={req._id} value={req._id}>
                  {req.centerName} - ₹{req.amount} - {req.reason}
                </option>
              ))}
            </select>

            <textarea
              className="form-control mb-3"
              rows="5"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Write your comments here..."
            ></textarea>

            <button className="btn btn-primary" onClick={handleRemarkSubmit}>
              Submit Remark
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditorDashboard;
