import { useState, useEffect } from "react";

function WalletConnect({ children }) {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(""); // Track selected role

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } else {
        alert("MetaMask is not installed!");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null); // disconnected
        }
      });
    }
  }, []);

  // Styles
  const cardStyle = {
    maxWidth: "450px",
    margin: "50px auto",
    borderRadius: "16px",
    border: "none",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    padding: "30px",
    textAlign: "center",
  };

  const buttonStyle = {
    borderRadius: "12px",
    padding: "10px 20px",
    fontWeight: "600",
  };

  // If role not chosen yet
  if (!role) {
    return (
      <div style={cardStyle} className="bg-light">
        <h4 className="mb-3 text-primary">👤 Select Your Role</h4>
        <select
          className="form-select mb-3"
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">-- Choose Role --</option>
          <option value="Admin">Admin</option>
          <option value="Community">Community</option>
          <option value="Auditor">Auditor</option>
          <option value="Public">Public</option>
        </select>
      </div>
    );
  }

  // Public role (no wallet connection required)
  if (role === "Public") {
    return (
      <div style={cardStyle} className="bg-white">
        <h5 className="mb-3 text-info">🌍 Public Dashboard</h5>
        <p className="text-muted">No wallet connection required for Public role.</p>
        <div className="mt-4">{children}</div>
      </div>
    );
  }

  // For Admin, Community, Auditor -> Show wallet connect flow
  if (!account) {
    return (
      <div style={cardStyle} className="bg-light">
        <h4 className="mb-3 text-primary">🔗 {role} - Connect Wallet</h4>
        <p className="text-muted">
          Securely connect your MetaMask wallet to continue as <b>{role}</b>.
        </p>
        <button
          className="btn btn-primary"
          style={buttonStyle}
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // If connected
  return (
    <div style={cardStyle} className="bg-white">
      <h5 className="mb-3 text-success">✅ Wallet Connected ({role})</h5>
      <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-light">
        <span className="fw-bold text-dark">
          {account.substring(0, 6)}...{account.slice(-4)}
        </span>
        <button
          className="btn btn-outline-danger btn-sm"
          style={{ borderRadius: "8px" }}
          onClick={disconnectWallet}
        >
          Disconnect
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default WalletConnect;
