// src/dashboards/PublicDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PublicDashboard.css";

export default function PublicDashboard() {
  const navigate = useNavigate();
  const [approvedFunds, setApprovedFunds] = useState([]);
  const [status, setStatus] = useState([]);
  const [milestones, setMilestones] = useState([]);

  // Fetch Approved Funds
  const fetchApprovedFunds = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/public/approved");
      setApprovedFunds(res.data || []);
    } catch (err) {
      console.error("Error fetching approved funds:", err);
      setApprovedFunds([]);
    }
  };

  // Fetch Status Updates
  const fetchStatus = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/status");
      setStatus(res.data || []);
    } catch (err) {
      console.error("Error fetching status:", err);
      setStatus([]);
    }
  };

  // Fetch Milestones
  const fetchMilestones = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/milestones");
      setMilestones(res.data || []);
    } catch (err) {
      console.error("Error fetching milestones:", err);
      setMilestones([]);
    }
  };

  useEffect(() => {
    fetchApprovedFunds();
    fetchStatus();
    fetchMilestones();
  }, []);

  const handleLogout = () => {
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="public-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">🌍 ChainVora Public</h2>
        <nav>
          <ul>
            <li onClick={fetchApprovedFunds}>✅ Approved Funds</li>
            <li onClick={fetchStatus}>📊 Status Tracking</li>
            <li onClick={fetchMilestones}>🎯 Milestones</li>
          </ul>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <h1 className="dashboard-title">Public Dashboard</h1>

        {/* Approved Funds */}
        <section className="card">
          <h2 className="card-title">✅ Approved Funds</h2>
          {approvedFunds.length === 0 ? (
            <p>No approved funds available.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Community Center</th>
                  <th>Wallet Address</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {approvedFunds.map((f) => (
                  <tr key={f._id}>
                    <td>{f.centerName}</td>
                    <td>{f.walletAddress || "-"}</td>
                    <td>₹{f.amount}</td>
                    <td>{f.reason}</td>
                    <td>{f.remarks?.length > 0 ? f.remarks.join(", ") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Status Updates */}
        <section className="card">
          <h2 className="card-title">📊 Status Tracking</h2>
          {status.length === 0 ? (
            <p>No status updates available.</p>
          ) : (
            <ul className="list">
              {status.map((s, idx) => (
                <li key={idx}>
                  <strong>{s.centerName}</strong> — {s.update}{" "}
                  <span className="date">({s.date})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Milestones */}
        <section className="card">
          <h2 className="card-title">🎯 Milestones</h2>
          {milestones.length === 0 ? (
            <p>No milestones reported yet.</p>
          ) : (
            <ul className="list">
              {milestones.map((m, idx) => (
                <li key={idx}>
                  <strong>{m.centerName}</strong> — {m.milestone}{" "}
                  {m.completed ? "✅" : "⏳"}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
