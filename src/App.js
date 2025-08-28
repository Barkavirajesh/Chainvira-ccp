import { useState } from "react";
import "./App.css";

function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState("Admin"); // default role

  const roles = ["Admin", "Community", "Auditor", "Public"];

  const connectWallet = async () => {
    try {
      if (role === "Public") {
        alert("Public role does not require wallet connection.");
        return;
      }
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

  const disconnectWallet = () => {
    setAccount(null);
  };

  return (
    <div className="wallet-ui">
      <h2 className="app-title">Fund Management System</h2>

      <div className="role-tabs">
        {roles.map((r) => (
          <button
            key={r}
            className={`role-tab ${role === r ? "active" : ""}`}
            onClick={() => setRole(r)}
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

        {role === "Public" && <p className="public-note">Access granted ✅</p>}

        {account && (
          <>
            <div className="connected-info">
              Connected: {account.substring(0, 6)}...{account.slice(-4)}
            </div>
            <button className="disconnect-btn" onClick={disconnectWallet}>
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default WalletConnect;
