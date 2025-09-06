import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import CommunityDashboard from "./dashboards/CommunityDashboard";

// ---------------- WalletConnect ----------------
function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState("Admin");
  const [lockedRole, setLockedRole] = useState(null);
  const navigate = useNavigate();

  const roles = ["Admin", "Community", "Auditor", "Public"];

  const connectWallet = async () => {
    try {
      let walletAddress = null;

      if (role !== "Public") {
        if (!window.ethereum) {
          alert("⚠ MetaMask is not installed!");
          return;
        }
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        walletAddress = accounts[0];
        setAccount(walletAddress);
      } else {
        walletAddress = "No Wallet";
        setAccount(null);
      }

      setLockedRole(role);

      await axios.post("http://localhost:5000/api/users/connect", {
        walletAddress,
        role,
      });

      console.log("✅ Role + wallet saved:", { walletAddress, role });
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const handleRoleChange = (r) => {
    if (lockedRole && lockedRole !== "Public") {
      alert(
        `⚠ You are already connected as ${lockedRole}. Switching is not allowed.`
      );
      return;
    }
    setRole(r);
  };

  const goNext = () => {
    if (!lockedRole) {
      alert("⚠ Please connect wallet or enter as Public first!");
      return;
    }
    switch (lockedRole) {
      case "Admin":
        navigate("/adminDashboard");
        break;
      case "Community":
        navigate("/communityDashboard");
        break;
      case "Auditor":
        navigate("/auditorDashboard");
        break;
      case "Public":
        navigate("/publicDashboard");
        break;
      default:
        alert("⚠ Invalid role!");
    }
  };

  return (
    <div className="wallet-ui">
      <h2 className="app-title">Fund Management System</h2>
      <div className="role-tabs">
        {roles.map((r) => (
          <button
            key={r}
            className={`role-tab ${role === r ? "active" : ""}`}
            onClick={() => handleRoleChange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="wallet-card">
        <div className="role-icon">🔑</div>
        <h3 className="role-title">{role} Login</h3>
        <p className="role-desc">
          {role === "Public"
            ? "You can view reports without connecting a wallet."
            : "Connect your MetaMask wallet to continue."}
        </p>

        {!lockedRole && (
          <button className="connect-btn" onClick={connectWallet}>
            {role === "Public" ? "Enter Public Role ✅" : "Connect Wallet"}
          </button>
        )}

        {lockedRole && (
          <div className="connected-info" style={{ marginTop: "15px" }}>
            ✅ Connected:{" "}
            {account
              ? `${account.substring(0, 6)}...${account.slice(-4)}`
              : "No Wallet"}{" "}
            as {lockedRole}
            <button
              className="next-btn"
              onClick={goNext}
              style={{ marginLeft: "10px" }}
            >
              Next ➡
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Sidebar ----------------
const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  return (
    <div style={styles.sidebar}>
      <h2 style={styles.sidebarTitle}>ChainVora {role}</h2>
      <nav style={styles.nav}>
        <button
          style={styles.link}
          onClick={() => navigate(`/${role.toLowerCase()}Dashboard`)}
        >
          Dashboard
        </button>
        {role === "Admin" && (
          <>
            <button style={styles.link} onClick={() => navigate("/addFunds")}>
              Add Funds
            </button>
            <button
              style={styles.link}
              onClick={() => navigate("/allocateFunds")}
            >
              Allocate Funds
            </button>
            <button
              style={styles.link}
              onClick={() => navigate("/fundTimeline")}
            >
              Fund Timeline
            </button>
            <button
              style={styles.link}
              onClick={() => navigate("/transactions")}
            >
              Transactions
            </button>
            <button style={styles.link} onClick={() => navigate("/funds")}>
              Approved Funds
            </button>
            <button style={styles.link} onClick={() => navigate("/users")}>
              Users
            </button>
          </>
        )}
        {role === "Community" && (
          <>
            <button
              style={styles.link}
              onClick={() => navigate("/communityDashboard")}
            >
              View Allocated Funds
            </button>
            <button style={styles.link} onClick={() => navigate("/uploadProof")}>
              Upload Proof
            </button>
            <button
              style={styles.link}
              onClick={() => navigate("/updateProgress")}
            >
              Update Progress
            </button>
            <button
              style={styles.link}
              onClick={() => navigate("/raiseRequest")}
            >
              Raise Request
            </button>
          </>
        )}
      </nav>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div style={styles.card}>
    <h3 style={{ fontSize: "16px", fontWeight: "600" }}>{title}</h3>
    <p style={{ fontSize: "20px", fontWeight: "bold", marginTop: "10px" }}>
      {value}
    </p>
  </div>
);

//---------------- Admin Dashboard ----------------
function AdminDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/requests");
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const handleAction = async (id, action) => {
    try {
      await axios.put(`http://localhost:5000/api/requests/${id}`, {
        status: action,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar role="Admin" />
      <div style={styles.main}>
        <div style={styles.header}>
          <h1 style={{ color: "blue" }}>Welcome, Admin</h1>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div
          style={{
            marginTop: "40px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={styles.cardTitle}>📥 Received Requests</h2>
          {requests.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No new requests available.</p>
          ) : (
            <table style={{ width: "100%", marginTop: "20px" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th>Center Name</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td>{req.centerName}</td>
                    <td>₹{req.amount}</td>
                    <td>{req.reason}</td>
                    <td>{req.status}</td>
                    <td>
                      {req.status === "Pending" ? (
                        <>
                          <button
                            style={{
                              ...styles.button,
                              marginRight: "10px",
                              background: "green",
                            }}
                            onClick={() => handleAction(req._id, "Approved")}
                          >
                            Approve
                          </button>
                          <button
                            style={{ ...styles.button, background: "red" }}
                            onClick={() => handleAction(req._id, "Rejected")}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span
                          style={{
                            fontWeight: "bold",
                            color: req.status === "Approved" ? "green" : "red",
                          }}
                        >
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
// ---------------- Add Funds Page ----------------
function AddFunds() {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [transactionHash, setTransactionHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState([]);

  // Fetch added funds
  const fetchFunds = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fundPool");
      const data = Array.isArray(res.data) ? res.data : res.data.funds || [];
      setFunds(data);
    } catch (err) {
      console.error("Error fetching fund pool:", err);
      setFunds([]);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  // Submit new funds
  const handleSubmit = async () => {
    if (!source || !amount || !purpose) {
      return alert("⚠ Please fill all required fields!");
    }
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/fundPool", {
        source,
        amount,
        purpose,
        notes,
      });

      setTransactionHash(res.data.txHash);
      alert("✅ Funds Added Successfully!");

      setSource("");
      setAmount("");
      setPurpose("");
      setNotes("");
      fetchFunds();
    } catch (err) {
      console.error("Error adding funds:", err);
      alert("❌ Failed to add funds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar role="Admin" />
      <div style={styles.main}>
        <h1>💰 Add Funds</h1>

        {/* Form */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={styles.cardTitle}>Add New Funds</h3>

          <label>Fund Source *</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={inputStyle}
          >
            <option value="">-- Select Source --</option>
            <option>Government Grant</option>
            <option>NGO</option>
            <option>CSR Donation</option>
            <option>Individual Contribution</option>
            <option>Others</option>
          </select>

          <label>Amount (₹) *</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            placeholder="Enter Amount"
          />

          <label>Purpose *</label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            style={inputStyle}
            placeholder="Education / Healthcare / Infrastructure / etc."
          />

          <label>Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={inputStyle}
            rows={3}
            placeholder="Extra details if any"
          />

          <button
            style={{ ...styles.button, marginTop: "10px" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "⏳ Adding..." : "Add Funds"}
          </button>

          {transactionHash && (
            <p style={{ marginTop: "15px", color: "green" }}>
              ✅ Blockchain Tx: {transactionHash}
            </p>
          )}
        </div>

        {/* Recent Funds Table */}
        <div
          style={{
            marginTop: "30px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={styles.cardTitle}>Recent Added Funds</h3>
          {funds.length === 0 ? (
            <p>No funds added yet.</p>
          ) : (
            <table style={{ width: "100%", marginTop: "10px" }}>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Date</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f._id}>
                    <td>{f.source}</td>
                    <td>₹{f.amount}</td>
                    <td>{f.purpose}</td>
                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td>{f.txHash ? f.txHash.slice(0, 10) + "..." : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}




// ---------------- Approved Funds Page ----------------
function ApprovedFunds() {
  const [funds, setFunds] = useState([]);

  const fetchFunds = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/funds");
      const data = Array.isArray(res.data) ? res.data : res.data.funds || [];
      setFunds(data);
    } catch (error) {
      console.error("Error fetching approved funds:", error);
      setFunds([]);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  return (
    <div style={styles.container}>
      <Sidebar role="Admin" />
      <div style={styles.main}>
        <h1>✅ Approved Funds</h1>
        {funds.length === 0 ? (
          <p>No funds allocated yet.</p>
        ) : (
          <table style={{ width: "100%", marginTop: "20px" }}>
            <thead>
              <tr>
                <th>Community Center</th>
                <th>Wallet Address</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td>{f.centerName}</td>
                  <td>{f.walletAddress || "N/A"}</td>
                  <td>₹{f.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------------- Allocate Funds Page ----------------
function AllocateFunds() {
  const [centers, setCenters] = useState([]);
  const [funds, setFunds] = useState([]);
  const [centerName, setCenterName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");

  const fetchCenters = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setCenters(res.data || []);
    } catch (err) {
      console.error("Error fetching centers:", err);
    }
  };

  const fetchFunds = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/funds");
      setFunds(res.data || []);
    } catch (err) {
      console.error("Error fetching allocated funds:", err);
    }
  };

  useEffect(() => {
    fetchCenters();
    fetchFunds();
  }, []);

  const handleAllocate = async () => {
    if (!centerName || !walletAddress || !amount) {
      return alert("⚠ Please fill all fields!");
    }
    try {
      await axios.post("http://localhost:5000/api/funds", {
        centerName,
        walletAddress,
        amount,
        purpose: "Direct Allocation",
        approvedBy: "Admin",
      });
      alert("✅ Funds Allocated Successfully!");
      setCenterName("");
      setWalletAddress("");
      setAmount("");
      fetchFunds();
    } catch (err) {
      console.error("Error allocating funds:", err);
      alert("❌ Failed to allocate funds");
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar role="Admin" />
      <div style={styles.main}>
        <h1>🏦 Allocate Funds</h1>

        {/* Form */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={styles.cardTitle}>Allocate to Community Center</h3>

          <label>Community Center *</label>
          <select
            value={centerName}
            onChange={(e) => {
              setCenterName(e.target.value);
              const c = centers.find((x) => x.name === e.target.value);
              if (c) setWalletAddress(c.walletAddress || "");
            }}
            style={inputStyle}
          >
            <option value="">-- Select Center --</option>
            {centers.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <label>Wallet Address *</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            style={inputStyle}
            placeholder="Enter Wallet Address"
          />

          <label>Amount (₹) *</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            placeholder="Enter Amount"
          />

          <button
            style={{ ...styles.button, marginTop: "10px" }}
            onClick={handleAllocate}
          >
            Allocate Funds
          </button>
        </div>

        {/* Allocations Table */}
        <div
          style={{
            marginTop: "30px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={styles.cardTitle}>📑 Allocated Funds</h3>
          {funds.length === 0 ? (
            <p>No allocations yet.</p>
          ) : (
            <table style={{ width: "100%", marginTop: "10px" }}>
              <thead>
                <tr>
                  <th>Community Center</th>
                  <th>Wallet Address</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f._id}>
                    <td>{f.centerName}</td>
                    <td>{f.walletAddress}</td>
                    <td>₹{f.amount}</td>
                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Fund Timeline Page ----------------
function FundTimeline() {
  const [timeline, setTimeline] = useState([]);

  const fetchTimeline = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fundTimeline");
      setTimeline(res.data);
    } catch (err) {
      console.error("Error fetching timeline:", err);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <div style={styles.container}>
      <Sidebar role="Admin" />
      <div style={styles.main}>
        <h1>📊 Fund Timeline</h1>
        {timeline.length === 0 ? (
          <p>No timeline data available.</p>
        ) : (
          <ul style={{ marginTop: "20px", listStyle: "none", padding: 0 }}>
            {timeline.map((item, idx) => (
              <li
                key={idx}
                style={{
                  background: "#fff",
                  marginBottom: "15px",
                  padding: "15px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <strong>{item.type}</strong> | {item.centerName} | ₹{item.amount}
                <br />
                <span style={{ color: "#6b7280" }}>{item.description}</span>
                <br />
                <small>
                  {item.status} |{" "}
                  {new Date(item.date).toLocaleString("en-IN")}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


// ---------------- App Root ----------------
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WalletConnect />} />
      <Route path="/adminDashboard" element={<AdminDashboard />} />
      <Route path="/addFunds" element={<AddFunds />} />
      <Route path="/funds" element={<ApprovedFunds />} />
      <Route path="/communityDashboard" element={<CommunityDashboard />} />
      <Route path="/allocateFunds" element={<AllocateFunds />} />
      <Route path="/fundTimeline" element={<FundTimeline />} />
    </Routes>
  );
}

// ---------------- Styles ----------------
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f9fafb",
  },
  sidebar: {
    width: "250px",
    background: "#111827",
    color: "#fff",
    padding: "20px",
  },
  sidebarTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  link: {
    background: "#1f2937",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    textAlign: "left",
  },
  main: {
    flex: 1,
    padding: "30px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutBtn: {
    background: "red",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    flex: 1,
    textAlign: "center",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  button: {
    background: "blue",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "8px",
  marginBottom: "15px",
  border: "1px solid #d1d5db",
  borderRadius: "5px",
};
