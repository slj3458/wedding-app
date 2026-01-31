// src/components/AdminPanel.jsx
import React, { useState } from "react";
import { API } from "../config"; // ADD THIS LINE

const AdminPanel = ({ onAdminChange }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(API.ADMIN_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Invalid password");
      }

      const data = await response.json();
      setAdminToken(data.token);
      setIsAdmin(true);
      setShowLogin(false);
      setPassword("");
      onAdminChange(true, data.token);
    } catch (err) {
      setError("Invalid password. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(API.ADMIN_LOGOUT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    setIsAdmin(false);
    setAdminToken(null);
    onAdminChange(false, null);
  };

  return (
    <div style={styles.container}>
      {!isAdmin ? (
        <div style={styles.loginSection}>
          {!showLogin ? (
            <button
              onClick={() => setShowLogin(true)}
              style={styles.adminButton}
            >
              🔐 Admin Login
            </button>
          ) : (
            <form onSubmit={handleLogin} style={styles.loginForm}>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.passwordInput}
                autoFocus
              />
              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.submitButton}>
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setPassword("");
                    setError("");
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
              {error && <div style={styles.error}>{error}</div>}
            </form>
          )}
        </div>
      ) : (
        <div style={styles.adminActive}>
          <span style={styles.adminBadge}>⚡ Admin Mode Active</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 1000,
  },
  loginSection: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  adminButton: {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#666",
    backgroundColor: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  loginForm: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "250px",
  },
  passwordInput: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "2px solid #e0e0e0",
    borderRadius: "6px",
    outline: "none",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
  },
  submitButton: {
    flex: 1,
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#667eea",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#666",
    backgroundColor: "#f0f0f0",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    color: "#f44336",
    fontSize: "13px",
    textAlign: "center",
  },
  adminActive: {
    backgroundColor: "#667eea",
    padding: "10px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 2px 8px rgba(102,126,234,0.3)",
  },
  adminBadge: {
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
  },
  logoutButton: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#667eea",
    backgroundColor: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default AdminPanel;
