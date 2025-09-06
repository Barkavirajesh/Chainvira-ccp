import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

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
          alert("⚠️ MetaMask is not installed!");
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
        `⚠️ You are already connected as ${lockedRole}. Switching is not allowed.`
      );
      return;
    }
    setRole(r);
  };

  const goNext = () => {
    if (!lockedRole) {
      alert("⚠️ Please connect wallet or enter as Public first!");
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
        alert("⚠️ Invalid role!");
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
            {account ? `${account.substring(0, 6)}...${account.slice(-4)}` : "No Wallet"}{" "}
            as {lockedRole}
            <button
              className="next-btn"
              onClick={goNext}
              style={{ marginLeft: "10px" }}
            >
              Next ➡️
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
            <button
              style={styles.link}
              onClick={() => navigate("/addFunds")}
            >
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
            <button
              style={styles.link}
              onClick={() => navigate("/uploadProof")}
            >
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

// ---------------- Dashboards ----------------
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
    const interval = setInterval(fetchRequests, 10000); // auto-refresh every 10s
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

// ---------------- Approved Funds Page ----------------
function ApprovedFunds() {
  const [funds, setFunds] = useState([]);

  const fetchFunds = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/funds");
      setFunds(res.data);
    } catch (error) {
      console.error("Error fetching approved funds:", error);
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
                <th>Total Allocated</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td>{f.centerName}</td>
                  <td>{f.walletAddress || "N/A"}</td>
                  <td>₹{f.totalAllocated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------------- Community Dashboard ----------------
function CommunityDashboard() {
  const navigate = useNavigate();
  const [funds, setFunds] = useState({ allocated: 0, spent: 0 });

  const [proofFile, setProofFile] = useState(null);
  const [progress, setProgress] = useState("");

  // Request form states
  const [centerName, setCenterName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const fetchFunds = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/funds");
      const centerFund = res.data.find((f) => f.centerName === centerName);
      if (centerFund) {
        setFunds({
          allocated: centerFund.totalAllocated,
          spent: 0, // Update if you track spent funds
        });
      }
    } catch (error) {
      console.error("Error fetching funds:", error);
    }
  };

  useEffect(() => {
    if (centerName) fetchFunds();
  }, [centerName]);

  const handleFileChange = (e) => setProofFile(e.target.files[0]);
  const handleUpload = () => {
    if (!proofFile) return alert("Select a file first!");
    alert(`Uploaded: ${proofFile.name}`);
    setProofFile(null);
  };

  const handleProgressUpdate = () => {
    if (!progress) return alert("Enter project progress!");
    alert(`Project progress updated: ${progress}`);
    setProgress("");
  };

  const handleRequest = async () => {
    if (!centerName || !amount || !reason) {
      return alert("⚠️ Please fill all fields before submitting!");
    }
    try {
      await axios.post("http://localhost:5000/api/requests", {
        centerName,
        amount,
        reason,
        status: "Pending",
      });
      alert("📤 Request sent successfully to Admin!");
      setCenterName("");
      setAmount("");
      setReason("");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("❌ Failed to send request");
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar role="Community" />
      <div style={styles.main}>
        <div style={styles.header}>
          <h1>Welcome, Community Center</h1>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={styles.cards}>
          <Card title="Allocated Funds" value={`₹${funds.allocated}`} />
          <Card title="Spent Funds" value={`₹${funds.spent}`} />
          <Card title="Remaining Funds" value={`₹${funds.allocated - funds.spent}`} />
        </div>

        <div
          style={{
            marginTop: "30px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={styles.cardTitle}>Raise a Request to Admin</h3>
          <input
            type="text"
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            placeholder="Enter Community Center Name"
            style={inputStyle}
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter Amount (₹)"
            style={inputStyle}
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter Reason for Request"
            rows={3}
            style={inputStyle}
          />
          <button style={styles.button} onClick={handleRequest}>
            Submit Request 📤
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Dummy Pages ----------------
function AuditorDashboard() {
  return <h2 style={{ padding: "30px" }}>Auditor Dashboard</h2>;
}
function PublicDashboard() {
  return <h2 style={{ padding: "30px" }}>Public Dashboard</h2>;
}
function AddFunds() {
  return <h2 style={{ padding: "30px" }}>💰 Add Funds Page</h2>;
}
function AllocateFunds() {
  return <h2 style={{ padding: "30px" }}>🏢 Allocate Funds Page</h2>;
}
function FundTimeline() {
  return <h2 style={{ padding: "30px" }}>📊 Fund Timeline Page</h2>;
}
function Transactions() {
  return <h2 style={{ padding: "30px" }}>📜 Transactions Page</h2>;
}
function Users() {
  return <h2 style={{ padding: "30px" }}>👥 Users Management Page</h2>;
}
function UploadProofs() {
  return <h2 style={{ padding: "30px" }}>✅ Verify Proofs Page</h2>;
}

// ---------------- Styles ----------------
const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#f4f6f8" },
  sidebar: { width: "240px", background: "#1e3a8a", color: "#fff", padding: "20px" },
  sidebarTitle: { fontSize: "20px", fontWeight: "bold", marginBottom: "30px" },
  nav: { display: "flex", flexDirection: "column", gap: "10px" },
  link: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    textAlign: "left",
    padding: "8px 0",
  },
  main: { flex: 1, padding: "30px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  logoutBtn: {
    background: "red",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  cards: { display: "flex", gap: "20px", marginTop: "20px" },
  card: {
    flex: 1,
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  cardTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "10px" },
  button: {
    background: "#1e3a8a",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

const inputStyle = { width: "100%", padding: "8px", margin: "10px 0", borderRadius: "6px", border: "1px solid #ccc" };

// ---------------- App ----------------
function App() {
  return (
    <Routes>
      <Route path="/" element={<WalletConnect />} />
      <Route path="/adminDashboard" element={<AdminDashboard />} />
      <Route path="/funds" element={<ApprovedFunds />} />
      <Route path="/communityDashboard" element={<CommunityDashboard />} />
      <Route path="/auditorDashboard" element={<AuditorDashboard />} />
      <Route path="/publicDashboard" element={<PublicDashboard />} />
      <Route path="/addFunds" element={<AddFunds />} />
      <Route path="/allocateFunds" element={<AllocateFunds />} />
      <Route path="/fundTimeline" element={<FundTimeline />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/users" element={<Users />} />
      <Route path="/uploadProof" element={<UploadProofs />} />
    </Routes>
  );
}

export default App;
