import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AuditorDashboard.css";

export default function AuditorDashboard() {
  const [requests, setRequests] = useState([]);
  const [activeSection, setActiveSection] = useState("review");
  const [remarkBox, setRemarkBox] = useState(null); // Track which request is being remarked
  const [remarks, setRemarks] = useState({}); // Store current input remarks

  // Fetch all requests
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

  // Handle review (approve)
  const handleReview = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/requests/${id}`, {
        status: "Reviewed",
      });
      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status: res.data.status } : req))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Handle remark submission
  const handleRemarkSubmit = async (id) => {
    if (!remarks[id]) return alert("Please enter a remark before submitting.");

    try {
      const res = await axios.post(
        `http://localhost:5000/api/requests/${id}/remark`,
        { remark: remarks[id] }
      );

      // Update the request in state to include new remark
      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, remarks: res.data.request.remarks } : req
        )
      );

      setRemarks({ ...remarks, [id]: "" }); // Clear input
      setRemarkBox(null); // Close remark box
      alert("Remark submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit remark.");
    }
  };

  // Handle view proof
  const handleViewProof = (url) => {
    if (url) window.open(url, "_blank");
    else alert("No proof uploaded yet.");
  };

  return (
    <div className="auditor-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Auditor Panel</h2>
        <button
          className={`nav-btn ${activeSection === "review" ? "active" : ""}`}
          onClick={() => setActiveSection("review")}
        >
          Review Requests
        </button>
        <button className="logout-btn">Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeSection === "review" && (
          <div>
            <h2 className="section-title">Review Community Center Requests</h2>
            {requests.length === 0 ? (
              <p>No requests found.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    background: "white",
                    padding: "15px",
                    marginBottom: "15px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                >
                  <p>
                    <strong>Community:</strong> {req.centerName}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{req.amount}
                  </p>
                  <p>
                    <strong>Reason:</strong> {req.reason}
                  </p>
                  <p>
                    <strong>Status:</strong> {req.status}
                  </p>

                  {/* Buttons */}
                  <button
                    className="submit-btn"
                    onClick={() => handleReview(req._id)}
                  >
                    Mark as Reviewed
                  </button>

                  <button
                    className="submit-btn"
                    style={{ marginLeft: "10px", background: "#6c757d" }}
                    onClick={() =>
                      setRemarkBox(remarkBox === req._id ? null : req._id)
                    }
                  >
                    Add Remark
                  </button>

                  <button
                    className="submit-btn"
                    style={{ marginLeft: "10px", background: "#007bff" }}
                    onClick={() => handleViewProof(req.proofUrl)}
                  >
                    View Proof
                  </button>

                  {/* Display existing remarks */}
                  {req.remarks && req.remarks.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <strong>Remarks:</strong>
                      <ul style={{ paddingLeft: "20px" }}>
                        {req.remarks.map((r, index) => (
                          <li key={index}>
                            {r.remark}{" "}
                            <small>({new Date(r.createdAt).toLocaleString()})</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Remark Box */}
                  {remarkBox === req._id && (
                    <div style={{ marginTop: "10px" }}>
                      <textarea
                        className="remarks-box"
                        placeholder="Enter your remarks..."
                        value={remarks[req._id] || ""}
                        onChange={(e) =>
                          setRemarks({ ...remarks, [req._id]: e.target.value })
                        }
                      />
                      <button
                        className="submit-btn"
                        style={{ marginTop: "8px" }}
                        onClick={() => handleRemarkSubmit(req._id)}
                      >
                        Submit Remark
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
