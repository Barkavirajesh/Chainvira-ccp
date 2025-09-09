import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./PublicDashboard.css";

export default function PublicDashboard() {
  const [funds, setFunds] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState({ totalPool: 0, totalAllocated: 0, availableBalance: 0 });
  const [selectedCenter, setSelectedCenter] = useState("All");

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

  // Fetch approved funds
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/requests")
      .then((res) => {
        const approved = res.data.filter((r) => r.status === "Reviewed");
        setFunds(approved);

        // Calculate summary
        const totalAllocated = approved.reduce((acc, curr) => acc + curr.amount, 0);
        setSummary({ totalPool: totalAllocated * 1.2, totalAllocated, availableBalance: totalAllocated * 0.2 });

        // Timeline data
        const timelineData = approved
          .map((r) => ({
            type: "Fund Approved",
            centerName: r.centerName,
            amount: r.amount,
            proofUrl: r.proofUrl,
            date: r.createdAt,
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTimeline(timelineData);
      })
      .catch((err) => console.error(err));
  }, []);

  // Filter funds by center
  const filteredFunds =
    selectedCenter === "All" ? funds : funds.filter((f) => f.centerName === selectedCenter);

  // Extract unique centers
  const centers = ["All", ...new Set(funds.map((f) => f.centerName))];

  return (
    <div className="public-dashboard">
      <header>
        <h1>Public Dashboard</h1>
      </header>

      {/* Summary Cards */}
      <section className="summary-cards">
        <div className="card blue">
          <h3>Total Fund Pool</h3>
          <p>₹{summary.totalPool}</p>
        </div>
        <div className="card green">
          <h3>Allocated Funds</h3>
          <p>₹{summary.totalAllocated}</p>
        </div>
        <div className="card orange">
          <h3>Available Balance</h3>
          <p>₹{summary.availableBalance}</p>
        </div>
      </section>

      {/* Filter by Center */}
      <section className="filter-center">
        <label htmlFor="centerSelect">Filter by Center: </label>
        <select
          id="centerSelect"
          value={selectedCenter}
          onChange={(e) => setSelectedCenter(e.target.value)}
        >
          {centers.map((c, idx) => (
            <option key={idx} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      {/* Funds Table */}
      <section className="funds-section">
        <h2>Approved Funds</h2>
        {filteredFunds.length === 0 ? (
          <p>No approved funds yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Center</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredFunds.map((f) => (
                <tr key={f._id}>
                  <td>{f.centerName}</td>
                  <td>₹{f.amount}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td>
                    {f.proofUrl ? (
                      <a href={f.proofUrl} target="_blank" rel="noreferrer">
                        View Proof
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Timeline */}
      <section className="timeline-section">
        <h2>Recent Milestones</h2>
        {timeline.length === 0 ? (
          <p>No milestones yet.</p>
        ) : (
          <ul className="timeline">
            {timeline.map((item, idx) => (
              <li key={idx}>
                <strong>{item.centerName}</strong> received ₹{item.amount} (
                {new Date(item.date).toLocaleDateString()})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pie Chart */}
      <section className="chart-section">
        <h2>Fund Distribution</h2>
        {filteredFunds.length === 0 ? (
          <p>No data for chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredFunds}
                dataKey="amount"
                nameKey="centerName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {filteredFunds.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}
