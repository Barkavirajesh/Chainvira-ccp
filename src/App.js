import { useState } from "react";
import axios from "axios";
import "./App.css";

function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState("Admin"); // default role
  const [lockedRole, setLockedRole] = useState(null); // store permanently connected role

  const roles = ["Admin", "Community", "Auditor", "Public"];

  const connectWallet = async () => {
    try {
      let walletAddress = null;

      if (role !== "Public") {
        if (!window.ethereum) {
          alert("MetaMask is not installed!");
          return;
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        walletAddress = accounts[0];
        setAccount(walletAddress);
      } else {
        // Public role does not require wallet, but we can log it as "No Wallet"
        walletAddress = "No Wallet";
      }

      setLockedRole(role); // lock the current role

      // Send wallet + role to backend
      const response = await axios.post("http://localhost:5000/api/users", {
        walletAddress,
        role,
      });

      console.log("Backend response:", response.data); // log to confirm
      alert(`Access granted and stored for role: ${role}`);
    } catch (error) {
      console.error("Wallet connection error:", error);
      alert("Failed to connect wallet or save data");
    }
  };

  const disconnectWallet = () => {
    alert("You cannot disconnect once the wallet is connected for this role.");
  };

  const handleRoleChange = (r) => {
    if (r === "Public") {
      setRole("Public");
      return;
    }

    if (lockedRole && lockedRole !== "Public") {
      alert(`You are already connected as ${lockedRole}. You cannot switch to another role.`);
      return;
    }

    setRole(r);
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

        {!account && role !== "Public" && (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {role === "Public" && <button className="connect-btn" onClick={connectWallet}>Enter Public Role ✅</button>}

        {account && (
          <>
            <div className="connected-info">
              Connected: {account.substring(0, 6)}...{account.slice(-4)} as {lockedRole}
            </div>
            <button className="disconnect-btn" onClick={disconnectWallet}>
              Disconnect ❌
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default WalletConnect;
