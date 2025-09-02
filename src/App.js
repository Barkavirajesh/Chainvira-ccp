import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// WalletConnect component
function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState("Admin"); // default role
  const [lockedRole, setLockedRole] = useState(null); // permanently locked role
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
        walletAddress = "No Wallet"; // Public role doesn’t need wallet
        setAccount(null);
      }

      setLockedRole(role); // Lock role once connected

      // Save to backend
      await axios.post("http://localhost:5000/api/users/connect", {
        walletAddress,
        role,
      });

      console.log("✅ Role + wallet saved:", { walletAddress, role });
    } catch (error) {
      console.error("Wallet connection error:", error);
      // ❌ removed alert
    }
  };

  const handleRoleChange = (r) => {
    if (lockedRole && lockedRole !== "Public") {
      alert(`⚠️ You are already connected as ${lockedRole}. Switching is not allowed.`);
      return;
    }
    setRole(r);
  };

  const goNext = () => {
    if (!lockedRole) {
      alert("⚠️ Please connect wallet or enter as Public first!");
      return;
    }

    // Navigate to the respective dashboard based on lockedRole
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

      {/* Role selection */}
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

      {/* Wallet card */}
      <div className="wallet-card">
        <div className="role-icon">🔑</div>
        <h3 className="role-title">{role} Login</h3>
        <p className="role-desc">
          {role === "Public"
            ? "You can view reports without connecting a wallet."
            : "Connect your MetaMask wallet to continue."}
        </p>

        {/* Connect button */}
        {!lockedRole && (
          <button className="connect-btn" onClick={connectWallet}>
            {role === "Public" ? "Enter Public Role ✅" : "Connect Wallet"}
          </button>
        )}

        {/* Connected info + Next button */}
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

// Minimal dashboard components
function AdminDashboard() {
  return <h1>Admin Dashboard</h1>;
}

function CommunityDashboard() {
  return <h1>Community Dashboard</h1>;
}

function AuditorDashboard() {
  return <h1>Auditor Dashboard</h1>;
}

function PublicDashboard() {
  return <h1>Public Dashboard</h1>;
}

// App component (no Router here!)
function App() {
  return (
    <Routes>
      <Route path="/" element={<WalletConnect />} />
      <Route path="/adminDashboard" element={<AdminDashboard />} />
      <Route path="/communityDashboard" element={<CommunityDashboard />} />
      <Route path="/auditorDashboard" element={<AuditorDashboard />} />
      <Route path="/publicDashboard" element={<PublicDashboard />} />
    </Routes>
  );
}

export default App;
